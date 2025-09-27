require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function analyze2024_01Images() {
  try {
    console.log('🔍 Analyzing 2024-01 images for insertion positions...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    
    // 2024-01の画像のみを抽出し、時系列順にソート
    const jan2024Images = artworks
      .filter(artwork => artwork.yearMonth === '2024-01')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    console.log(`📊 Found ${jan2024Images.length} images in 2024-01`);
    console.log('\n📋 Current 2024-01 images (newest to oldest):');
    
    jan2024Images.forEach((artwork, index) => {
      const sizeInfo = artwork.originalName ? ` (${artwork.originalName})` : '';
      const commentInfo = artwork.comment ? ` - "${artwork.comment}"` : '';
      console.log(`  ${(index + 1).toString().padStart(2, '0')}. ${artwork.filename}${sizeInfo}${commentInfo}`);
    });
    
    console.log('\n🎯 Missing positions (where new images should be inserted):');
    console.log('  Position 6: Between items 5 and 6');
    console.log('  Position 12: Between items 11 and 12'); 
    console.log('  Position 35: Between items 34 and 35');
    console.log('  Position 36: Between items 35 and 36');
    
    console.log('\n📁 Images to upload (in order by file size):');
    console.log('  1. IMG_7467.WEBP (1.1MB) → Position 6');
    console.log('  2. 無題127_20240108153820.png (0.83MB) → Position 12');
    console.log('  3. 無題133_20240124172304.png (6.6MB) → Position 35');
    console.log('  4. IMG_9357.WEBP (0.82MB) → Position 36');
    
  } catch (error) {
    console.error('❌ Error analyzing images:', error.message);
  }
}

analyze2024_01Images();
