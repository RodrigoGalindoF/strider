/* 3. Cluster Visualizer/8. searchLogic.js
   ------------------------------------------------
   Centralised logic for the search-bar (live term, debounced term) and
   the "excluded keywords" feature. It exposes a React hook –
   useSearchLogic – that InteractiveDentalTaxonomy can consume.
   The hook purposefully maintains its own local state so that the
   main component can stay lean.

   Exports (returned from the hook):
   - searchTerm                – string currently visible in the input.
   - debouncedSearchTerm       – value after debounceDelay ms.
   - excludedKeywords          – array of lowercase strings.
   - handleSearchChange        – onChange handler for the text input.
   - handleAddExcludedKeyword  – excludes a single term.
   - handleRemoveExcludedKeyword – removes a term from the exclusion list.
   - handleAddMultipleExcludedKeywords – bulk exclude helper.
   - resetExcludedKeywords     – clear the exclusions + search inputs.
*/

function useSearchLogic(debounceDelay = 300) {
    // --- State ---
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
    const [excludedKeywords, setExcludedKeywords] = React.useState([]);

    // --- Local debounce utility (closure over latest setter) ---
    const debounce = React.useCallback((fn, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }, []);

    // Debounced setter for filtering term
    const debouncedSetter = React.useMemo(() =>
        debounce((value) => setDebouncedSearchTerm(value), debounceDelay)
    , [debounce, debounceDelay]);

    // --- Helpers ---
    const normalise = (str) => str.trim().toLowerCase();

    const handleSearchChange = (e) => {
        const newVal = e.target.value;
        setSearchTerm(newVal);
        debouncedSetter(newVal);
    };

    const handleAddExcludedKeyword = (rawKeyword) => {
        const keyword = normalise(rawKeyword.replace(/^"|"$/g, ''));
        if (!keyword) return;
        setExcludedKeywords(prev => prev.includes(keyword) ? prev : [...prev, keyword]);

        setSearchTerm(prev => {
            // Remove the keyword from the visible input if present
            const terms = prev.split(',').map(t => t.trim());
            const newTerms = terms.filter(t => normalise(t) !== keyword);
            const joined = newTerms.join(', ');
            debouncedSetter(joined);
            return joined;
        });
    };

    const handleRemoveExcludedKeyword = (rawKeyword) => {
        const keyword = normalise(rawKeyword);
        setExcludedKeywords(prev => prev.filter(k => k !== keyword));
        // Do NOT mutate searchTerm here – user can choose to re-add it manually.
    };

    const handleAddMultipleExcludedKeywords = (rawSearchTermString) => {
        const termsToExclude = rawSearchTermString.split(',')
            .map(t => normalise(t.replace(/^"|"$/g, '')))
            .filter(Boolean);
        if (termsToExclude.length === 0) return;

        setExcludedKeywords(prev => {
            const unique = [...new Set([...prev, ...termsToExclude])];
            return unique;
        });
        setSearchTerm('');
        setDebouncedSearchTerm('');
    };

    const resetExcludedKeywords = () => {
        setExcludedKeywords([]);
        setSearchTerm('');
        setDebouncedSearchTerm('');
    };

    // --- Return API ---
    return {
        searchTerm,
        debouncedSearchTerm,
        excludedKeywords,
        handleSearchChange,
        handleAddExcludedKeyword,
        handleRemoveExcludedKeyword,
        handleAddMultipleExcludedKeywords,
        resetExcludedKeywords
    };
}

// Expose to global scope (consistent with existing code-base style)
window.useSearchLogic = useSearchLogic; 