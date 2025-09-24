const { Octokit } = require('@octokit/rest');
require('dotenv').config({ path: '.env.local' });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function cleanupUnwantedImages() {
  try {
    console.log('🗑️  Cleaning up unwanted images...');
    
    // artworks.json を読み込み
    const artworksResponse = await octokit.rest.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const content = Buffer.from(artworksResponse.data.content, 'base64').toString();
    const artworks = JSON.parse(content);
    
    console.log('Current artworks: ' + artworks.length);
    
    // 残すファイル
    const keepFile = '1758328781850-491y6wb1l.webp';
    
    // 削除対象ファイル
    const deleteFiles = [
      '1758611491426-tshs4yt5y.webp',
      '1758611351129-tvwpgr6dk.webp', 
      '1757892432103-lqmtcalqu.png'
    ];
    
    console.log('\\nKeeping: ' + keepFile);
    console.log('Deleting: ' + deleteFiles.join(', '));
    
    // artworks.json から削除対象を除外
    const filteredArtworks = artworks.filter(artwork => 
      !deleteFiles.includes(artwork.filename)
    );
    
    console.log('\\nArtworks after filtering: ' + filteredArtworks.length);
    
    if (filteredArtworks.length !== artworks.length) {
      // artworks.json を更新
      const updatedContent = JSON.stringify(filteredArtworks, null, 2);
      
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/artworks.json',
        message: '🗑️ Remove unwanted test images, keep only ' + keepFile,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: artworksResponse.data.sha,
      });
      
      console.log('✅ Updated artworks.json');
      
      // 各画像ファイルを削除
      for (const filename of deleteFiles) {
        try {
          const imageResponse = await octokit.rest.repos.getContent({
            owner: 'siro-314',
            repo: 'shiro-gallery-data',
            path: 'public/images/' + filename
          });
          
          await octokit.rest.repos.deleteFile({
            owner: 'siro-314',
            repo: 'shiro-gallery-data',
            path: 'public/images/' + filename,
            message: '🗑️ Delete unwanted image: ' + filename,
            sha: imageResponse.data.sha,
          });
          
          console.log('✅ Deleted: ' + filename);
          
        } catch (imgError) {
          console.log('⚠️  Image may not exist: ' + filename);
        }
      }
      
    } else {
      console.log('ℹ️  No changes needed');
    }
    
    console.log('\\n🎯 Final result: Only ' + keepFile + ' remains');
    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

cleanupUnwantedImages();
