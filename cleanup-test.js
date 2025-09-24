const { Octokit } = require('@octokit/rest');
require('dotenv').config({ path: '.env.local' });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function deleteTestImages() {
  try {
    console.log('🗑️  Preparing to delete test images...');
    
    // artworks.json を読み込み
    const artworksResponse = await octokit.rest.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const content = Buffer.from(artworksResponse.data.content, 'base64').toString();
    const artworks = JSON.parse(content);
    
    console.log('Current artworks: ' + artworks.length);
    
    // 最新のテスト画像を削除（今回アップロードしたもの）
    const testImage = '1758669018780-ebv1r266j.webp';
    
    console.log('\\n🎯 Deleting test image: ' + testImage);
    
    // artworks.json から該当作品を削除
    const filteredArtworks = artworks.filter(artwork => artwork.filename !== testImage);
    
    console.log('Artworks after filtering: ' + filteredArtworks.length);
    
    if (filteredArtworks.length < artworks.length) {
      // artworks.json を更新
      const updatedContent = JSON.stringify(filteredArtworks, null, 2);
      
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/artworks.json',
        message: '🗑️ Remove test image: ' + testImage,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: artworksResponse.data.sha,
      });
      
      console.log('✅ Updated artworks.json');
      
      // 画像ファイル自体も削除
      try {
        const imageResponse = await octokit.rest.repos.getContent({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: 'public/images/' + testImage
        });
        
        await octokit.rest.repos.deleteFile({
          owner: 'siro-314',
          repo: 'shiro-gallery-data',
          path: 'public/images/' + testImage,
          message: '🗑️ Delete test image: ' + testImage,
          sha: imageResponse.data.sha,
        });
        
        console.log('✅ Deleted image file: ' + testImage);
        
      } catch (imgError) {
        console.log('⚠️  Image file may not exist: ' + testImage);
      }
      
    } else {
      console.log('ℹ️  No test images found to delete');
    }
    
    console.log('\\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

deleteTestImages();
