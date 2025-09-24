const { Octokit } = require('@octokit/rest');
require('dotenv').config({ path: '.env.local' });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function main() {
  try {
    console.log('🔍 Checking GitHub repository contents...');
    
    const response = await octokit.rest.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/images'
    });
    
    console.log('📁 Images in repository:');
    const images = response.data.filter(item => item.type === 'file');
    
    images.forEach((item, i) => {
      console.log('  ' + (i+1) + '. ' + item.name + ' (' + item.size + ' bytes)');
    });
    
    console.log('Total: ' + images.length + ' images');
    
    // Test images identification
    const testImages = images.filter(item => {
      const name = item.name.toLowerCase();
      return name.includes('test') || name.includes('claude');
    });
    
    if (testImages.length > 0) {
      console.log('\\n🧪 Test images to remove:');
      testImages.forEach(item => {
        console.log('  - ' + item.name);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
