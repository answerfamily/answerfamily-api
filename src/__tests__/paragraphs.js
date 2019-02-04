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

const {
  ES_FIXTURES: REAL_ES_FIXTURES,
} = require('../__fixtures__/realWorldArticleParagraph');

describe('paragraphs', () => {
  beforeAll(async () => {
    await loadESFixtures(ES_FIXTURES);
    await loadMongoFixtures(MONGO_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(ES_FIXTURES);
    await unloadMongoFixtures(MONGO_FIXTURES);
  });

  it('lists unfiltered paragraphs', async () => {
    const { data, errors } = await gql`
      {
        paragraphs {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does limiting', async () => {
    const { data, errors } = await gql`
      {
        paragraphs(first: 1) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does skipping', async () => {
    const { data, errors } = await gql`
      {
        paragraphs(skip: 1) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does sorting', async () => {
    const { data, errors } = await gql`
      {
        paragraphs(sort: [{ by: createdAt, order: ASC }]) {
          id
          text
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });

  it('does filtering', async () => {
    const { data, errors } = await gql`
      {
        paragraphs(
          filter: {
            inText: "哇哇哇哇哇哇哇哇 國中小實施同志教育 會變成合法 外國同性戀來台灣治療愛滋 全民買單 哇啦哇啦哇啦"
            contain: "愛滋"
            includeHighlight: true
          }
        ) {
          id
          text
          _highlight
        }
      }
    `();

    expect(errors).toBeUndefined();
    expect(data).toMatchSnapshot();
  });
});

describe('paragraphs filtering works for long documents', () => {
  beforeAll(async () => {
    await loadESFixtures(REAL_ES_FIXTURES);
  });

  afterAll(async () => {
    await unloadESFixtures(REAL_ES_FIXTURES);
  });

  it('lists identical, existing paragraphs', async () => {
    const { data, errors } = await gql`
      query($text: String) {
        paragraphs(filter: { inText: $text }) {
          id
          text
        }
      }
    `({
      text: `
        國中教科書教性解放：
        1.國中如何性滿足
        2.如何性愛自拍
        3.鼓勵統計性伴侶人數
        4.介紹師生戀
        5.介紹人動物戀/交合

        您看了能做甚麼？
        我們正站在這時代的破口上，在這關鍵時刻，請每位至少找10～50位以上聯署，把這破口堵上，為我們的孩子、孫子把關，救救我們的子孫！

        大家傾全力愛家公投連署~
        https://m.youtube.com/watch?v=ZXuUuVtc07Q&feature=youtu.be my
        請大家看

        看看現在的國中/高中教科書如何教孩子性解放
        https://youtu.be/RG4f_W82ATk

        但，你我可以用“公投”來扭轉這混亂的局勢，使台灣的教育恢復禮義廉恥的祥和社會！

        1.「荒腔走版的校園色情教育」。

        2.「公投」的寫法（超簡單的）。
      `,
    });

    expect(errors).toBeUndefined();
    expect(data.paragraphs.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['a1p1', 'a1p2', 'a1p3', 'a1p4', 'a1p5'])
    );
  });

  it('lists similar paragraphs', async () => {
    const { data, errors } = await gql`
      query($text: String) {
        paragraphs(filter: { inText: $text }) {
          id
          text
        }
      }
    `({
      text: `
        淫亂的台灣執政黨

        盡快把自己的子女送國外唸書
        政府教小二性滿足，性愛自拍！不要怪我罵支持蔡英文的人，真是她媽的變態！
        https://m.youtube.com/watch?v=ZXuUuVtc07Q&feature=youtu.be
      `,
    });

    expect(errors).toBeUndefined();
    expect(data.paragraphs.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['a1p1', 'a1p2'])
    );
  });
});
