const {
  loadESFixtures,
  unloadESFixtures,
  loadMongoFixtures,
  unloadMongoFixtures,
} = require('../../test/fixtures');
const gql = require('../../test/gql');
const {
  ES_FIXTURES,
  MONGO_FIXTURES,
} = require('../__fixtures__/articleParagraphReply');

describe('Basic object type graph resolving', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('loads from article to reply', async () => {
    const { data, errors } = await gql`
      {
        article(id: "article1") {
          text
          paragraphs {
            id
            text
            paragraphReplies {
              id
              reply {
                id
                text
              }
              canDelete
            }
            canDelete
          }
          createdAt
          sources {
            id
            article {
              id
            }
            url
            hyperlink {
              title
              articleSources {
                id
              }
            }
          }
          hyperlinks {
            title
          }
        }
      }
    `({}, { userPromise: Promise.resolve({ iss: 'other-author' }) });

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('loads from reply to article', async () => {
    const { data, errors } = await gql`
      {
        reply(id: "r1") {
          paragraphReplies {
            id
            paragraph {
              id
              article {
                id
              }
              canDelete
            }
            canDelete
          }
          hyperlinks {
            title
          }
        }
      }
    `(
      {},
      {
        userPromise: Promise.resolve({ iss: 'author1' }),
      }
    );

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('loads from paragraph as well', async () => {
    const { data, errors } = await gql`
      {
        paragraph(id: "p1") {
          article {
            id
          }
          paragraphReplies {
            id
            reply {
              id
              text
            }
          }
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('loads hyperlinks from text', async () => {
    const text =
      '大法官已釋憲，如果年底公投沒達到500萬票，明年五月台灣將成為亞洲第一個同性可合法結婚的國家。\n\n外國同性戀藉結婚來台治療愛滋病，都是健保支付，全民買單。\n\n學校對國中小實施同志教育，將成為合法。\n\n這次公投要主動向票務員領10、11、12三張公投單選 “同意”\n\n11/24一定要去公投!讓我們盡一份心力保護後代子孫。 https://m.youtube.com/watch?v=ZXuUuVtc07Q&feature=youtu.be';
    const { data, errors } = await gql`
      query($text: String!) {
        hyperlinks(inText: $text) {
          title
        }
      }
    `({ text });

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});
