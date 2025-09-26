require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function analyzeData() {
  try {
    console.log('🔍 Analyzing current data structure...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    console.log(`📊 Total artworks: ${artworks.length}`);
    
    // 年月別に分類
    const groupByYearMonth = {};
    artworks.forEach((artwork, index) => {
      const yearMonth = artwork.yearMonth || 'unknown';
      if (!groupByYearMonth[yearMonth]) {
        groupByYearMonth[yearMonth] = [];
      }
      groupByYearMonth[yearMonth].push({
        index: index,
        filename: artwork.filename,
        comment: artwork.comment || 'なし',
        isMonthBorder: artwork.isMonthBoundary || false
      });
    });
    
    // 年月順にソート
    const sortedYearMonths = Object.keys(groupByYearMonth).sort();
    
    console.log('\n📅 年月別データ分析:');
    sortedYearMonths.forEach(yearMonth => {
      const group = groupByYearMonth[yearMonth];
      console.log(`\n🗓️ ${yearMonth}: ${group.length}件`);
      
      group.forEach((item, i) => {
        const borderMark = item.isMonthBorder ? ' [境目]' : '';
        const commentMark = item.comment !== 'なし' ? ` (${item.comment})` : '';
        console.log(`  ${i+1}. ${item.filename}${borderMark}${commentMark}`);
      });
    });
    
    // 月境目フラグの分析
    const borderItems = artworks.filter(a => a.isMonthBoundary);
    console.log(`\n🚩 月境目フラグが付いている画像: ${borderItems.length}件`);
    borderItems.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.filename} (${item.yearMonth})`);
    });
    
    // months.jsonも確認
    try {
      const monthsResponse = await octokit.repos.getContent({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: 'public/data/months.json'
      });
      
      const months = JSON.parse(Buffer.from(monthsResponse.data.content, 'base64').toString());
      console.log('\n📅 months.json:');
      months.forEach((month, i) => {
        console.log(`  ${i+1}. ${month}`);
      });
    } catch (error) {
      console.log('\n⚠️ months.json could not be read:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing data:', error.message);
  }
}

analyzeData();
