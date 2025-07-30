import db from './src/config/db.js';

async function testCommunities() {
    try {
        console.log('Testing community data...');
        
        // Test the full updated query
        const query = `
            SELECT 
                c.community_id,
                c.community_name,
                c.description,
                c.created_at,
                cm.joined_at,
                cm.role as member_role,
                CASE 
                    WHEN l.location_name IS NOT NULL THEN json_build_object('location_name', l.location_name, 'country', l.country)
                    ELSE NULL
                END AS location
            FROM community c
            INNER JOIN community_membership cm ON c.community_id = cm.community_id
            LEFT JOIN locations l ON c.location_id = l.location_id
            WHERE cm.user_id = $1
            ORDER BY cm.joined_at DESC
        `;
        
        const communities = await db.manyOrNone(query, ['6e0b6ac5-0c12-4c20-870f-748ec9d6ce0c']);
        console.log('User communities with full query:', JSON.stringify(communities, null, 2));
        
    } catch (error) {
        console.error('Error testing communities:', error);
    } finally {
        process.exit(0);
    }
}

testCommunities();
