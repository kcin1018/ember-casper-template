'use strict';

const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-function');
const cssnano = require('cssnano');
const customProperties = require('postcss-custom-properties');
const postcssImport = require('postcss-import');
const yamlFront = require('yaml-front-matter');
const StaticSiteJson = require('broccoli-static-site-json');
const MergeTrees = require('broccoli-merge-trees');
const walkSync = require('walk-sync');
const _ = require('lodash');

const { readFileSync } = require('fs');
const { join } = require('path');

const attributes = [
  'uuid',
  'title',
  'image',
  'imageMeta',
  'featured',
  'page',
  'status',
  'language',
  'meta_title',
  'meta_description',
  'date',
  'tags'
];

const references = ['author']

const jsonTrees = ['content', 'page'].map((contentFolder) => {
  return new StaticSiteJson(contentFolder, {
    attributes,
    references,
    contentFolder,
    collections: [{
      src: contentFolder,
      output: `${contentFolder}.json`,
    }],
  });
});

const authorTree = new StaticSiteJson(`author`, {
  contentFolder: 'author',
  attributes: [
    'name',
    'image',
    'cover',
    'coverMeta',
    'bio',
    'website',
    'twitter',
    'facebook',
    'location',
  ],
  collections: [{
    src: 'author',
    output: 'author.json',
  }]
});

module.exports = {
  name: 'ember-casper-template',

  options: {
    postcssOptions: {
      compile: {
        enable: true,
        plugins: [
          { module: postcssImport },
          { module: customProperties },
          { module: colorFunction },
          { module: autoprefixer },
          { module: cssnano },
        ]
      }
    }
  },

  // isDevelopingAddon() {
  //   return true;
  // },

  treeForPublic() {
    return MergeTrees([...jsonTrees, authorTree]);
  },

  urlsForPrember() {
    const staticUrls = ['/'];

    const content = walkSync('content', {
      globs: ['*.md'],
    });

    const tagUrls = _.chain(content)
      .map(path => yamlFront.loadFront(readFileSync(join('content', path))))
      .map(file => file.tags)
      .flatten()
      .uniq()
      .map(tag => `/tag/${tag}`)
      .value();

    const contentUrls = content.map(file => file.replace(/\.md$/, ''));

    const authorUrls = walkSync('author', {
      globs: ['*.md'],
    }).map(file => file.replace(/\.md$/, '')).map(file => `/author/${file}`);

    return [...staticUrls, ...contentUrls, ...authorUrls, ...tagUrls];
  },

  included(app) {
    this._super.included.apply(this, arguments)

    app.import('node_modules/downsize-cjs/index.js', {
      using: [
        { transformation: 'cjs', as: 'downsize'}
      ]
    });

    app.options.postcssOptions = Object.assign({
        compile: {
          enable: true,
          plugins: [
            { module: postcssImport },
            { module: customProperties },
            { module: colorFunction },
            { module: autoprefixer },
            { module: cssnano },
          ]
        }
      },
      app.options.postcssOptions
    );
  },
};
