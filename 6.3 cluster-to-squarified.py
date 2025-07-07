import os
import json
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import multiprocessing as mp
from functools import partial
import numpy as np
from typing import Dict, List, Any, Optional
import hashlib

# Types for our data structure
class NodeType:
    PILLAR = 'pillar'
    PARENT = 'parent'
    SUBTOPIC = 'subtopic'
    CLUSTER = 'cluster'
    KEYWORDS = 'keywords'

def validate_metadata(metadata: Dict[str, Any]) -> bool:
    """Validate metadata structure and content"""
    required_fields = ['centroid_keywords', 'tfidf_keywords', 'cluster_size', 'keyword_diversity_samples']
    return all(field in metadata and metadata[field] is not None for field in required_fields)

def validate_keyword(keyword_data: Dict[str, Any]) -> bool:
    """Validate keyword data structure and content"""
    required_fields = ['keyword', 'searchVolume', 'keywordDifficulty', 'cpc']
    return all(field in keyword_data and keyword_data[field] is not None for field in required_fields)

def calculate_data_hash(data: Dict[str, Any]) -> str:
    """Calculate a hash of the data for integrity checking"""
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

def read_csv_keywords(file_path: str) -> Dict[str, Any]:
    """Read CSV file and get keywords and search volume"""
    try:
        # Verify file exists and is readable
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Read the first 5 lines for metadata
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [next(f) for _ in range(5)]
        
        # Extract and validate metadata
        metadata = {
            'centroid_keywords': lines[0].replace('# centroid_keywords: ', '').strip(),
            'tfidf_keywords': lines[1].replace('# tfidf_keywords: ', '').strip(),
            'cluster_size': int(lines[2].replace('# cluster_size: ', '').strip()),
            'keyword_diversity_samples': lines[3].replace('# keyword_diversity_samples_in_cluster: ', '').strip()
        }
        
        if not validate_metadata(metadata):
            raise ValueError(f"Invalid metadata in file: {file_path}")

        # Read CSV data using row 5 as header (after 4 metadata rows)
        df = pd.read_csv(
            file_path,
            skiprows=4,
            header=0,
            encoding='utf-8',
            dtype=str,
            engine='c',
            na_filter=False,
            memory_map=True
        )
        
        # Verify required columns exist
        required_columns = [
            'keyword',
            'Semrush_Search Volume',
            'Semrush_Keyword Difficulty',
            'Semrush_CPC (USD)'
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns in {file_path}: {missing_columns}")
        
        # Process keywords with vectorized operations where possible
        keywords = []
        
        # Convert numeric columns in bulk with validation
        try:
            search_volumes = df['Semrush_Search Volume'].str.replace(',', '').replace('', '0').astype(float).astype(int)
            keyword_difficulties = pd.to_numeric(df['Semrush_Keyword Difficulty'].replace('', '0'), errors='coerce').fillna(0)
            cpcs = pd.to_numeric(df['Semrush_CPC (USD)'].replace('', '0'), errors='coerce').fillna(0)
        except Exception as e:
            raise ValueError(f"Error converting numeric columns in {file_path}: {str(e)}")
        
        # Process each row with validation
        for idx, row in df.iterrows():
            try:
                keyword = str(row['keyword']).strip()
                if keyword:
                    keyword_data = {
                        'keyword': keyword,
                        'searchVolume': int(search_volumes[idx]),
                        'keywordDifficulty': float(keyword_difficulties[idx]),
                        'cpc': float(cpcs[idx]),
                        'funnelStage': row.get('Semrush_Funnel Stage', ''),
                        'searchIntent': row.get('Semrush_Search Intent', ''),
                        'level4_cluster': row.get('level4_cluster', ''),
                        'category': row.get('category', '')
                    }
                    
                    if validate_keyword(keyword_data):
                        keywords.append(keyword_data)
                    else:
                        print(f"Warning: Invalid keyword data in row {idx} of {file_path}")
            except Exception as e:
                print(f"Error processing row {idx} in {file_path}: {str(e)}")
                continue

        # Calculate total search volume
        total_search_volume = sum(k['searchVolume'] for k in keywords)
        
        result = {
            'keywords': keywords,
            'totalKeywords': len(keywords),
            'totalSearchVolume': total_search_volume,
            'metadata': metadata
        }
        
        # Add data integrity hash
        result['data_hash'] = calculate_data_hash(result)
        
        return result
    except Exception as e:
        print(f"Error reading CSV file {file_path}:")
        print(f"Full error details: {str(e)}")
        return {
            'keywords': [],
            'totalKeywords': 0,
            'totalSearchVolume': 0,
            'metadata': {
                'centroid_keywords': '',
                'tfidf_keywords': '',
                'cluster_size': 0,
                'keyword_diversity_samples': ''
            },
            'data_hash': calculate_data_hash({'keywords': [], 'totalKeywords': 0, 'totalSearchVolume': 0})
        }

def process_cluster_file(cluster_path: str) -> Dict[str, Any]:
    """Process a single cluster file"""
    try:
        cluster_data = read_csv_keywords(cluster_path)
        
        # Extract path components to maintain hierarchy information
        path_parts = Path(cluster_path).parts
        cluster_index = path_parts.index('3.1 Qualified Clusters')
        
        # Build hierarchy information
        hierarchy = {
            'pillar': path_parts[cluster_index + 1],
            'parent': path_parts[cluster_index + 2],
            'subtopic': path_parts[cluster_index + 3] if len(path_parts) > cluster_index + 3 else None,
            'cluster': path_parts[-1].replace('.csv', '')
        }
        
        # Transform keywords to match expected format
        transformed_keywords = []
        total_search_volume = 0
        total_kd = 0
        total_cpc = 0
        
        for kw in cluster_data['keywords']:
            transformed_keywords.append({
                'keyword': kw['keyword'],
                'searchVolume': kw['searchVolume'],
                'keywordDifficulty': kw['keywordDifficulty'],
                'cpc': kw['cpc']
            })
            total_search_volume += kw['searchVolume']
            total_kd += kw['keywordDifficulty']
            total_cpc += kw['cpc']
        
        total_keywords = len(transformed_keywords)
        avg_kd = total_kd / total_keywords if total_keywords > 0 else 0
        avg_cpc = total_cpc / total_keywords if total_keywords > 0 else 0
        
        result = {
            'name': hierarchy['cluster'],
            'type': NodeType.CLUSTER,
            'hierarchy': hierarchy,
            'metadata': cluster_data['metadata'],
            'keywords': transformed_keywords,
            'size': total_search_volume,
            'totalKeywords': total_keywords,
            'totalClusters': 1,
            'averageKD': avg_kd,
            'averageCPC': avg_cpc
        }
        
        return result
    except Exception as e:
        print(f"Error processing cluster file {cluster_path}: {str(e)}")
        try:
            path_parts = Path(cluster_path).parts
            cluster_index = path_parts.index('3.1 Qualified Clusters')
            hierarchy = {
                'pillar': path_parts[cluster_index + 1] if len(path_parts) > cluster_index + 1 else 'Unknown',
                'parent': path_parts[cluster_index + 2] if len(path_parts) > cluster_index + 2 else 'Unknown',
                'subtopic': path_parts[cluster_index + 3] if len(path_parts) > cluster_index + 3 else None,
                'cluster': Path(cluster_path).stem
            }
        except ValueError:
            # Fallback if the directory structure is different
            hierarchy = {
                'pillar': 'Unknown',
                'parent': 'Unknown', 
                'subtopic': None,
                'cluster': Path(cluster_path).stem
            }
        
        return {
            'name': Path(cluster_path).stem,
            'type': NodeType.CLUSTER,
            'hierarchy': hierarchy,
            'metadata': {
                'centroid_keywords': '',
                'tfidf_keywords': '',
                'cluster_size': 0,
                'keyword_diversity_samples': ''
            },
            'keywords': [],
            'size': 0,
            'totalKeywords': 0,
            'totalClusters': 0,
            'averageKD': 0,
            'averageCPC': 0
        }

def aggregate_node_metrics(node: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate metrics from a node and its children"""
    # Initialize metrics
    total_search_volume = 0
    total_keywords = 0
    total_clusters = 0
    total_kd = 0
    total_cpc = 0
    all_keywords = []
    
    # If it's a cluster node, use its own metrics
    if node.get('type') == NodeType.CLUSTER:
        if node.get('keywords'):
            all_keywords = node['keywords']
            total_search_volume = sum(kw['searchVolume'] for kw in all_keywords)
            total_keywords = len(all_keywords)
            total_kd = sum(kw['keywordDifficulty'] for kw in all_keywords)
            total_cpc = sum(kw['cpc'] for kw in all_keywords)
            total_clusters = 1
    # For non-cluster nodes, aggregate from children
    elif node.get('children'):
        for child in node['children']:
            # Recursively aggregate child metrics
            child_metrics = aggregate_node_metrics(child)
            
            # Add child metrics to totals
            total_search_volume += child_metrics['size']
            total_keywords += child_metrics['totalKeywords']
            total_clusters += child_metrics['totalClusters']
            total_kd += child_metrics['averageKD'] * child_metrics['totalKeywords']
            total_cpc += child_metrics['averageCPC'] * child_metrics['totalKeywords']
            
            # Collect keywords if this is a cluster node
            if child_metrics.get('keywords'):
                all_keywords.extend(child_metrics['keywords'])
    
    # Calculate averages
    avg_kd = total_kd / total_keywords if total_keywords > 0 else 0
    avg_cpc = total_cpc / total_keywords if total_keywords > 0 else 0
    
    # Prepare the result with the calculated metrics
    result = {
        **node,
        'size': total_search_volume,
        'totalKeywords': total_keywords,
        'totalClusters': total_clusters,
        'averageKD': avg_kd,
        'averageCPC': avg_cpc
    }
    
    # Handle keywords display based on node type
    if node.get('type') == NodeType.CLUSTER:
        # For cluster nodes, use all keywords and sort them alphabetically
        # Sort keywords alphabetically
        result['keywords'] = sorted(all_keywords, key=lambda x: x['keyword'].lower())
    else:
        # For non-cluster nodes, don't include keywords
        result['keywords'] = []
        # Keep the children for non-cluster nodes
        if node.get('children'):
            result['children'] = node['children']
    
    return result

def build_data_structure(base_path: str) -> Dict[str, Any]:
    """Build the data structure from the folder"""
    try:
        data = []
        processed_files = 0
        error_files = 0
        structure_log = []  # Track the structure variations we find
        
        # First, collect all CSV files to process
        all_csv_files = []
        for root, _, files in os.walk(base_path):
            for file in files:
                if file.endswith('.csv'):
                    all_csv_files.append(os.path.join(root, file))
        
        if not all_csv_files:
            raise ValueError(f"No CSV files found in {base_path}")
        
        # Create single global progress bar
        pbar = tqdm(total=len(all_csv_files), desc="Processing cluster files")
        
        # Create a pool of workers
        num_cores = mp.cpu_count()
        pool = mp.Pool(processes=num_cores)
        
        # Process files in parallel
        results = {}
        for result in pool.imap_unordered(process_cluster_file, all_csv_files):
            pbar.update(1)
            if result['keywords']:  # Check if we have any keywords
                processed_files += 1
            else:
                error_files += 1
            # Store result with its path for later organization
            results[result['name']] = result
        
        pool.close()
        pool.join()
        pbar.close()
        
        # Organize results into the hierarchical structure (quietly)
        for pillar_topic in os.listdir(base_path):
            if pillar_topic.startswith('.'):
                continue
            
            pillar_path = os.path.join(base_path, pillar_topic)
            if not os.path.isdir(pillar_path):
                continue
            
            pillar_node = {
                'name': pillar_topic,
                'type': NodeType.PILLAR,
                'children': []
            }
            
            # Process each level with validation
            for parent_topic in os.listdir(pillar_path):
                if parent_topic.startswith('.'):
                    continue
                
                parent_path = os.path.join(pillar_path, parent_topic)
                if not os.path.isdir(parent_path):
                    continue
                
                parent_node = {
                    'name': parent_topic,
                    'type': NodeType.PARENT,
                    'children': []
                }
                
                sub_items = os.listdir(parent_path)
                has_subtopics = any(os.path.isdir(os.path.join(parent_path, item)) for item in sub_items)
                
                # Log the structure variation we found
                structure_path = f"{pillar_topic} -> {parent_topic}"
                if has_subtopics:
                    structure_path += " -> [Subtopics]"
                structure_log.append(structure_path)
                
                if has_subtopics:
                    for sub_item in sub_items:
                        if sub_item.startswith('.'):
                            continue
                        
                        sub_path = os.path.join(parent_path, sub_item)
                        if not os.path.isdir(sub_path):
                            continue
                        
                        sub_node = {
                            'name': sub_item,
                            'type': NodeType.SUBTOPIC,
                            'children': []
                        }
                        
                        for cluster_file in os.listdir(sub_path):
                            if not cluster_file.endswith('.csv'):
                                continue
                            
                            cluster_name = cluster_file.replace('.csv', '')
                            if cluster_name in results:
                                cluster_data = results[cluster_name]
                                sub_node['children'].append(cluster_data)
                        
                        if sub_node['children']:
                            # Aggregate metrics for subtopic
                            sub_node = aggregate_node_metrics(sub_node)
                            parent_node['children'].append(sub_node)
                else:
                    for cluster_file in sub_items:
                        if not cluster_file.endswith('.csv'):
                            continue
                        
                        cluster_name = cluster_file.replace('.csv', '')
                        if cluster_name in results:
                            cluster_data = results[cluster_name]
                            parent_node['children'].append(cluster_data)
                
                if parent_node['children']:
                    # Aggregate metrics for parent
                    parent_node = aggregate_node_metrics(parent_node)
                    pillar_node['children'].append(parent_node)
            
            if pillar_node['children']:
                # Aggregate metrics for pillar
                pillar_node = aggregate_node_metrics(pillar_node)
                data.append(pillar_node)
        
        # Store structure variations in statistics but don't print them
        return {
            'data': data,
            'statistics': {
                'total_files': len(all_csv_files),
                'processed_files': processed_files,
                'error_files': error_files,
                'success_rate': f"{(processed_files/len(all_csv_files))*100:.2f}%",
                'structure_variations': sorted(set(structure_log))
            }
        }
    except Exception as e:
        print(f"Error building data structure: {str(e)}")
        raise

def transform_and_save_data():
    """Main function to transform and save data"""
    try:
        # Get the current working directory
        current_dir = Path.cwd()
        
        # Construct the base path
        base_path = current_dir / '3.1 Qualified Clusters'
        
        # Build the data structure
        result = build_data_structure(str(base_path))
        
        # Calculate total keywords across all clusters
        total_keywords = sum(pillar['totalKeywords'] for pillar in result['data'])
        
        # Save the transformed data
        output_path = current_dir / 'squarified-ready.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print('Data transformation completed successfully!')
        print(f'Output saved to: {output_path}')
        print(f'Statistics:')
        print(f'  Total files: {result["statistics"]["total_files"]}')
        print(f'  Successfully processed: {result["statistics"]["processed_files"]}')
        print(f'  Files with errors: {result["statistics"]["error_files"]}')
        print(f'  Success rate: {result["statistics"]["success_rate"]}')
        print(f'  Total Keywords: {total_keywords}')
        
    except Exception as e:
        print(f'Error transforming data: {str(e)}')
        raise

if __name__ == '__main__':
    # Set pandas to use more memory
    pd.options.mode.chained_assignment = None
    transform_and_save_data() 