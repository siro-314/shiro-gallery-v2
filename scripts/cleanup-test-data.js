require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function cleanupTestData() {
  try {
    console.log('🧹 Starting test data cleanup...');
    
    // 現在のartworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const currentContent = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    console.log(`📊 Current artworks: ${currentContent.length}`);
    
    // 2025年のテスト画像を除外（2024年以前のみ保持）
    const filteredArtworks = currentContent.filter(artwork => {
      const year = artwork.yearMonth ? artwork.yearMonth.split('-')[0] : '2024';
      return parseInt(year) <= 2024;
    });
    
    console.log(`🔍 After filtering (<=2024): ${filteredArtworks.length}`);
    console.log('📋 Keeping:');
    filteredArtworks.forEach((artwork, i) => {
      console.log(`  ${i+1}. ${artwork.filename} (${artwork.yearMonth})`);
    });
    
    if (filteredArtworks.length === currentContent.length) {
      console.log('✅ No test data found to remove');
      return;
    }
    
    // 削除対象を表示
    const toDelete = currentContent.filter(artwork => {
      const year = artwork.yearMonth ? artwork.yearMonth.split('-')[0] : '2024';
      return parseInt(year) > 2024;
    });
    
    console.log('🗑️ Removing test data:');
    toDelete.forEach((artwork, i) => {
      console.log(`  ${i+1}. ${artwork.filename} (${artwork.yearMonth})`);
    });
    
    // artworks.jsonを更新
    const newContent = Buffer.from(JSON.stringify(filteredArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: '🧹 テストデータクリーンアップ: 2025年のテスト画像を削除',
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('✅ artworks.json updated successfully');
    
    // 対応するimagesディレクトリからファイルも削除
    for (const artwork of toDelete) {
      try {
        const imagePath = `public/images/${artwork.filename}`;
        const imageResponse = await octokit.repos.getContent({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath
        });
        
        await octokit.repos.deleteFile({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath,
          message: `🧹 テスト画像削除: ${artwork.filename}`,
          sha: imageResponse.data.sha
        });
        
        console.log(`🗑️ Deleted image: ${artwork.filename}`);
      } catch (error) {
        console.log(`⚠️ Could not delete image ${artwork.filename}: ${error.message}`);
      }
    }
    
    // months.jsonも再生成が必要か確認
    const months = [...new Set(filteredArtworks.map(a => a.yearMonth))].sort();
    console.log('📅 Remaining months:', months);
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

cleanupTestData();
