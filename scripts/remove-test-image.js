require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function removeTestImage() {
  try {
    console.log('🗑️ Removing 2025-09 test image...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    console.log(`📊 Current artworks: ${artworks.length}`);
    
    // 2025-09のデータを特定
    const testImage = artworks.find(artwork => artwork.yearMonth === '2025-09');
    if (testImage) {
      console.log(`🔍 Found test image: ${testImage.filename} (${testImage.yearMonth})`);
      
      // 画像ファイルも削除を試行
      try {
        const imagePath = `public/images/${testImage.yearMonth}/${testImage.filename}`;
        const imageResponse = await octokit.repos.getContent({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath
        });
        
        await octokit.repos.deleteFile({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: imagePath,
          message: `🗑️ テスト画像削除: ${testImage.filename}`,
          sha: imageResponse.data.sha
        });
        
        console.log(`🗑️ Deleted image file: ${testImage.filename}`);
      } catch (error) {
        console.log(`⚠️ Could not delete image file: ${error.message}`);
      }
    }
    
    // 2025-09以外のデータのみ残す
    const filteredArtworks = artworks.filter(artwork => artwork.yearMonth !== '2025-09');
    console.log(`📊 After removal: ${filteredArtworks.length} artworks`);
    
    // artworks.jsonを更新
    const newContent = Buffer.from(JSON.stringify(filteredArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: '🗑️ テストデータ削除: 2025-09のテスト画像を削除',
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('✅ artworks.json updated successfully');
    
    // months.jsonも更新
    const months = [...new Set(filteredArtworks.map(a => a.yearMonth))].sort().reverse();
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
    
    console.log('🎉 Test image removal completed!');
    console.log(`📊 Final count: ${filteredArtworks.length} artworks`);
    
  } catch (error) {
    console.error('❌ Error removing test image:', error.message);
  }
}

removeTestImage();
