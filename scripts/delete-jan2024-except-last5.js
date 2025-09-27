require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// 残す最後の5枚の画像（originalName）
const keepImages = [
  'IMG_7439.webp',
  'IMG_7306.webp', 
  'IMG_7288.webp',
  'IMG_7281.webp',
  'IMG_7280.jpeg'
];

async function deleteJan2024ImagesExceptLast5() {
  try {
    console.log('🗑️ Deleting 2024-01 images except last 5...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    
    // 2024-01の画像を特定
    const jan2024Images = artworks.filter(artwork => artwork.yearMonth === '2024-01');
    console.log(`📊 Found ${jan2024Images.length} images in 2024-01`);
    
    // 削除対象を特定（最後の5枚以外）
    const toDelete = jan2024Images.filter(artwork => !keepImages.includes(artwork.originalName));
    console.log(`🗑️ Will delete ${toDelete.length} images`);
    
    console.log('\n📋 Images to keep:');
    keepImages.forEach((name, i) => {
      console.log(`  ${i+1}. ${name}`);
    });
    
    console.log('\n📋 Images to delete:');
    toDelete.forEach((artwork, i) => {
      console.log(`  ${i+1}. ${artwork.originalName || artwork.filename}`);
    });
    
    // 画像ファイルを削除
    for (const artwork of toDelete) {
      try {
        const imagePath = `public/images/2024-01/${artwork.filename}`;
        const imageResponse = await octokit.repos.getContent({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath
        });
        
        await octokit.repos.deleteFile({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath,
          message: `🗑️ 削除: ${artwork.originalName || artwork.filename} (2024-01整理)`,
          sha: imageResponse.data.sha
        });
        
        console.log(`🗑️ Deleted image: ${artwork.originalName || artwork.filename}`);
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`⚠️ Could not delete image ${artwork.filename}: ${error.message}`);
      }
    }
    
    // 残すアートワークのみでartworks.jsonを更新
    const remainingArtworks = artworks.filter(artwork => {
      if (artwork.yearMonth !== '2024-01') return true; // 他の年月は残す
      return keepImages.includes(artwork.originalName); // 2024-01は指定された5枚のみ残す
    });
    
    console.log(`\n📊 Before: ${artworks.length} total artworks`);
    console.log(`📊 After: ${remainingArtworks.length} total artworks`);
    console.log(`📊 Deleted: ${artworks.length - remainingArtworks.length} artworks`);
    
    // artworks.jsonを更新
    const newContent = Buffer.from(JSON.stringify(remainingArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: '🗑️ 2024-01整理: 最後の5枚以外を削除（順次アップロード準備）',
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('✅ artworks.json updated successfully');
    
    // 最終確認
    const jan2024Remaining = remainingArtworks.filter(a => a.yearMonth === '2024-01').length;
    console.log(`📅 2024-01 now contains: ${jan2024Remaining} images (should be 5)`);
    
    console.log('\n🎉 2024-01 cleanup completed! Ready for sequential upload.');
    
  } catch (error) {
    console.error('❌ Error deleting images:', error.message);
  }
}

deleteJan2024ImagesExceptLast5();
