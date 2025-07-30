// Function to test the API endpoints
async function testTagging() {
    const BASE_URL = 'http://localhost:5001';
    
    try {
        console.log('Testing posts endpoint...');
        const postsResponse = await fetch(`${BASE_URL}/api/posts?limit=5`);
        const postsData = await postsResponse.json();
        
        console.log('\n=== POSTS DATA ===');
        console.log('Number of posts:', postsData.posts?.length || 0);
        
        if (postsData.posts && postsData.posts.length > 0) {
            const firstPost = postsData.posts[0];
            console.log('\nFirst post:');
            console.log('- Title:', firstPost.title);
            console.log('- Tags:', JSON.stringify(firstPost.tags, null, 2));
            console.log('- Has tags?', !!firstPost.tags && firstPost.tags.length > 0);
        }
        
        console.log('\nTesting trending tags endpoint...');
        const tagsResponse = await fetch(`${BASE_URL}/api/posts/trending-tags`);
        const tagsData = await tagsResponse.json();
        
        console.log('\n=== TRENDING TAGS DATA ===');
        console.log('Number of trending tags:', tagsData.tags?.length || 0);
        
        if (tagsData.tags && tagsData.tags.length > 0) {
            console.log('\nTrending tags:');
            tagsData.tags.forEach((tag, index) => {
                console.log(`${index + 1}. Name: "${tag.name}", Count: ${tag.count}`);
            });
        }
        
    } catch (error) {
        console.error('Error testing API:', error.message);
        console.log('Make sure the backend server is running on port 5001');
    }
}

testTagging();
