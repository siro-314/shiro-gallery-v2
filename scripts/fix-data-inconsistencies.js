require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fixDataInconsistencies() {
  try {
    console.log('🔧 Fixing data inconsistencies...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    console.log(`📊 Total artworks: ${artworks.length}`);
    
    // 2024-02の謎の画像を2024-01に移動
    const fixedArtworks = artworks.map(artwork => {
      if (artwork.yearMonth === '2024-02' && artwork.filename.includes('fvuvahpnl')) {
        console.log(`🔄 Moving ${artwork.filename} from 2024-02 to 2024-01`);
        return { ...artwork, yearMonth: '2024-01' };
      }
      return artwork;
    });
    
    // 年月順に並び替え（新しい順）
    const sortedArtworks = fixedArtworks.sort((a, b) => {
      const dateA = new Date(`${a.yearMonth}-01`);
      const dateB = new Date(`${b.yearMonth}-01`);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // 新しい順
      }
      // 同じ月内では uploadedAt でソート
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
    
    console.log('\n📅 修正後の年月別データ:');
    const groups = {};
    sortedArtworks.forEach(artwork => {
      if (!groups[artwork.yearMonth]) groups[artwork.yearMonth] = 0;
      groups[artwork.yearMonth]++;
    });
    
    Object.entries(groups).sort().reverse().forEach(([yearMonth, count]) => {
      console.log(`  ${yearMonth}: ${count}件`);
    });
    
    // artworks.jsonを更新
    const newContent = Buffer.from(JSON.stringify(sortedArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: '🔧 データ修正: 2024-02の誤分類画像を2024-01に移動',
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('✅ artworks.json updated successfully');
    
    // months.jsonも再生成
    const months = [...new Set(sortedArtworks.map(a => a.yearMonth))].sort().reverse();
    console.log('\n📅 Updated months:', months);
    
    try {
      // 既存のmonths.jsonを取得
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
        message: '📅 更新: months.json （2024-02削除、正しい年月リスト）',
        content: monthsContent,
        sha: monthsResponse.data.sha
      });
      
      console.log('✅ months.json updated successfully');
    } catch (error) {
      console.log('⚠️ months.json update failed:', error.message);
    }
    
    console.log('🎉 Data fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing data:', error.message);
  }
}

fixDataInconsistencies();
