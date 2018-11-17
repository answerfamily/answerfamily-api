const { ObjectId } = require('mongodb');

exports.ES_FIXTURES = {
  '/articles/article1': {
    text:
      '大法官已釋憲，如果年底公投沒達到500萬票，明年五月台灣將成為亞洲第一個同性可合法結婚的國家。\n\n外國同性戀藉結婚來台治療愛滋病，都是健保支付，全民買單。\n\n學校對國中小實施同志教育，將成為合法。\n\n這次公投要主動向票務員領10、11、12三張公投單選 “同意”\n\n11/24一定要去公投!讓我們盡一份心力保護後代子孫。',
    createdAt: new Date('2018-10-29T02:59:39.039Z')
  },
  '/paragraphs/p1': {
    articleId: 'article1',
    text: '外國同性戀藉結婚來台治療愛滋病，都是健保支付，全民買單',
    createdAt: '2018-10-29T01:38:47.416Z',
  },
  '/paragraphs/p2': {
    articleId: 'article1',
    text: '學校對國中小實施同志教育，將成為合法',
    createdAt: '2018-10-29T01:38:47.417Z',
  },
  '/replies/r1': {
    text:
      '「外國同性戀藉結婚來台治療愛滋病，都是健保支付，全民買單」這句話其實並不算錯，但實務上並不會有「拖垮健保」的狀況，也跟同性婚姻關係不大，所以不用太擔心唷。',
    reference: `
      衛福部 - 有關網路流傳外國人染愛滋病來台2年後，所有外國人的愛滋病治療費用是由健保署負擔，疾管署特此說明
      https://www.cdc.gov.tw/info.aspx?treeid=45da8e73a81d495d&nowtreeid=1bd193ed6dabaee6&tid=14D38681253864AB&fbclid=IwAR1mtdGIYYbHdiB99pZg_YQSwGXUD-DMj47fmgFnrphQ778k73SQzZkEUDk
    `,
    createdAt: '2018-10-29T01:38:47.416Z',
  },
  '/replies/r2': {
    text:
      '國中小的「同志教育」其實一直都在《性別平等教育法實行細則》裡頭，只是在保守團體的打壓之下，在國小的課本中沒有出現過。',
    reference:
      '《同志教育怎麼教？》（含字幕）https://www.youtube.com/watch?v=mp2CCtEPAPA',
    createdAt: '2018-10-29T01:38:47.416Z',
  },
};

exports.MONGO_FIXTURES = {
  paragraphReplies: [
    {
      _id: ObjectId('5bd677bb092a3ee2541b1a0d'),
      paragraphId: 'p1',
      replyId: 'r1',
      createdAt: new Date('2018-10-29T02:59:39.040Z'),
    },

    {
      _id: ObjectId('5bd677ef092a3ee2541b1a1d'),
      paragraphId: 'p2',
      replyId: 'r2',
      createdAt: new Date('2018-10-29T02:59:39.041Z'),
    },
  ],

  articleSources: [
    {
      articleId: 'article1',
      createdAt: new Date('2018-10-29T02:59:39.043Z'),
      url: 'http://google.com',
    },
  ],
};
