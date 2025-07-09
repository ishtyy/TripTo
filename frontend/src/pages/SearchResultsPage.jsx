import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Search, Compass, Users } from 'lucide-react';

// Updated to include a card for communities
const ResultCard = ({ result, type }) => {
    if (type === 'destinations') {
        return (
            <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-800 flex items-center gap-4">
                <Compass className="text-purple-400 w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">{result.location_name}</h3>
                    <p className="text-sm text-gray-400">{result.country}</p>
                </div>
            </div>
        );
    }
    if (type === 'posts') {
        return (
             <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-800">
                <h3 className="font-bold text-purple-300 truncate">{result.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mt-1">{result.content}</p>
                <p className="text-xs text-gray-500 mt-2">By {result.user_profile?.username || 'Unknown'}</p>
            </div>
        )
    }
    if (type === 'communities') {
        return (
            <Link to={`/communities/${result.community_id}`} className="block bg-gray-900/80 p-4 rounded-lg border border-gray-800 hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center gap-4">
                    <Users className="text-cyan-400 w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-white">{result.community_name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-1">{result.description}</p>
                    </div>
                </div>
            </Link>
        )
    }
    return null;
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const query = searchParams.get('q');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query || !type) {
        setLoading(false);
        setError("Invalid search query.");
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        let endpoint = '';
        if (type === 'destinations') {
          endpoint = `/locations?q=${query}`;
        } else if (type === 'posts') {
          endpoint = `/posts?q=${query}`;
        } else if (type === 'communities') { // ADDED THIS CASE
          endpoint = `/communities?q=${query}`;
        } else {
            throw new Error("Invalid search type");
        }

        const res = await api.get(endpoint);
        // Handle different data structures from the API
        setResults(res.data.posts || res.data.locations || res.data.communities || []);

      } catch (err) {
        setError('Failed to fetch search results.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, query]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <h1 className="text-2xl font-bold text-white">
            Search Results for <span className="text-purple-400">"{query}"</span>
        </h1>
        <p className="text-gray-400 capitalize">Category: {type}</p>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500" size={32} /></div>}
      {error && <p className="text-center py-10 text-red-400 bg-red-900/30 p-4 rounded-md">{error}</p>}
      
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
            <Search size={48} className="text-gray-600 mb-4 mx-auto"/>
            <h3 className="text-xl font-bold text-white">No Results Found</h3>
            <p className="text-gray-400 mt-2">
              We couldn't find anything matching your search. Try a different term.
            </p>
        </div>
      )}
      
      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
                <ResultCard key={result.post_id || result.location_id || result.community_id || index} result={result} type={type} />
            ))}
        </div>
      )}
    </div>
  );
}