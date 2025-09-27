require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function move202509To202401() {
  try {
    console.log('🔄 Moving 2025-09 images to 2024-01...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    
    // 2025-09の画像を特定
    const images202509 = artworks.filter(artwork => artwork.yearMonth === '2025-09');
    console.log(`📊 Found ${images202509.length} images in 2025-09`);
    
    if (images202509.length === 0) {
      console.log('✅ No images found in 2025-09 to move');
      return;
    }
    
    console.log('\n📋 Images to move:');
    images202509.forEach((artwork, i) => {
      console.log(`  ${i+1}. ${artwork.originalName || artwork.filename}`);
    });
    
    // アートワークの年月を2024-01に変更
    const updatedArtworks = artworks.map(artwork => {
      if (artwork.yearMonth === '2025-09') {
        return { ...artwork, yearMonth: '2024-01' };
      }
      return artwork;
    });
    
    // 年月順に並び替え
    const sortedArtworks = updatedArtworks.sort((a, b) => {
      const dateA = new Date(`${a.yearMonth}-01`);
      const dateB = new Date(`${b.yearMonth}-01`);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // 新しい順
      }
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
    
    // artworks.jsonを更新
    const newContent = Buffer.from(JSON.stringify(sortedArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: '🔄 修正: 2025-09の画像を2024-01に移動（デフォルト年月問題の修正）',
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('✅ artworks.json updated successfully');
    
    // months.jsonも更新
    const months = [...new Set(sortedArtworks.map(a => a.yearMonth))].sort().reverse();
    console.log('📅 Updated months:', months);
    
    try {
      const monthsResponse = await octokit.repos.getContent({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/months.json'
      });
      
      const monthsContent = Buffer.from(JSON.stringify(months, null, 2)).toString('base64');
      
      await octokit.repos.createOrUpdateFileContents({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/months.json',
        message: '📅 更新: months.json（2025-09削除後）',
        content: monthsContent,
        sha: monthsResponse.data.sha
      });
      
      console.log('✅ months.json updated successfully');
    } catch (error) {
      console.log('⚠️ months.json update failed:', error.message);
    }
    
    // 最終結果
    const jan2024Count = sortedArtworks.filter(a => a.yearMonth === '2024-01').length;
    console.log(`\n📊 2024-01 now contains: ${jan2024Count} images`);
    
    console.log('🎉 Move completed!');
    
  } catch (error) {
    console.error('❌ Error moving images:', error.message);
  }
}

move202509To202401();
