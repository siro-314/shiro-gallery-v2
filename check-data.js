const { Octokit } = require('@octokit/rest');
require('dotenv').config({ path: '.env.local' });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function checkData() {
  try {
    console.log('🔍 Checking data files...');
    
    const dataResponse = await octokit.rest.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data'
    });
    
    console.log('📄 Data files:');
    const dataFiles = dataResponse.data.filter(item => item.type === 'file');
    
    dataFiles.forEach((item, i) => {
      console.log('  ' + (i+1) + '. ' + item.name);
    });
    
    // artworks.json の内容を確認
    if (dataFiles.find(f => f.name === 'artworks.json')) {
      console.log('\\n📋 Checking artworks.json content...');
      
      const artworksResponse = await octokit.rest.repos.getContent({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/artworks.json'
      });
      
      const content = Buffer.from(artworksResponse.data.content, 'base64').toString();
      const artworks = JSON.parse(content);
      
      console.log('Total artworks: ' + artworks.length);
      
      // 最新の作品を表示
      const recent = artworks.slice(-5);
      console.log('\\nRecent artworks:');
      recent.forEach(artwork => {
        console.log('  - ' + artwork.filename + ' (' + artwork.uploadDate + ')');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
