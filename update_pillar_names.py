#!/usr/bin/env python3
import json
import sys

def update_pillar_names(data):
    """Update pillar topic names to be more user-friendly"""
    
    # Mapping of current names to friendly names
    name_mapping = {
        "human resources": "Human Resources",
        "candidates": "Job Candidates", 
        "developer": "Software Development",
        "databases": "Database Management",
        "devops_tools": "DevOps & Tools",
        "offshore_outsourcing": "Offshore Outsourcing",
        "emerging_tech": "Emerging Technologies",
        "salary": "Salary & Compensation",
        "programming_languages": "Programming Languages",
        "cloud_platforms": "Cloud Platforms",
        "software": "Software Solutions",
        "jobs_work": "Jobs & Work",
        "hiring": "Hiring & Recruitment",
        "web_frameworks": "Web Frameworks",
        "staffing": "Staffing Services",
        "immigration_forms": "Immigration & Visas",
        "mobile_development": "Mobile Development"
    }
    
    def update_node(node):
        """Recursively update node names and pillar fields"""
        if isinstance(node, dict):
            # Update name if it's a pillar topic
            if node.get("type") == "pillar" and "name" in node:
                old_name = node["name"]
                if old_name in name_mapping:
                    node["name"] = name_mapping[old_name]
                    print(f"Updated: 'name' '{old_name}' → '{name_mapping[old_name]}'")
            # Update pillar field if it matches
            if "pillar" in node:
                old_pillar = node["pillar"]
                if old_pillar in name_mapping:
                    node["pillar"] = name_mapping[old_pillar]
                    print(f"Updated: 'pillar' '{old_pillar}' → '{name_mapping[old_pillar]}'")
            # Recursively update children
            for value in node.values():
                update_node(value)
        elif isinstance(node, list):
            for item in node:
                update_node(item)
    
    # Update the data
    update_node(data)
    return data

def main():
    input_file = "squarified-ready.json"
    output_file = "squarified-ready.json"
    
    print("Reading JSON file...")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    print("Updating pillar topic names...")
    updated_data = update_pillar_names(data)
    
    print("Writing updated file...")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        print("Successfully updated pillar topic names!")
    except Exception as e:
        print(f"Error writing file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 