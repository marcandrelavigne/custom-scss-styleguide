const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const glob = require('glob-all');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WatchTimePlugin = require('webpack-watch-time-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  let config = {
	entry: {
	  styles: './src/build/index.scss',
	},

	output: {
	  filename: ({ chunk: { name } }) => {
		return name === 'styles' ? 'style/[name].js' : '[name]/[name].js';
	  },
	  chunkFilename: '[name].js?ver=[chunkhash]',
	  publicPath: '/wp-content/themes/pms/dist/',
	},
	resolve: {
	  extensions: ['*', '.js'],
	},
	mode: 'development',
	performance: {
	  hints: false,
	},
	devtool: 'source-map',
	module: {
	  rules: [
		
		{
		  test: /\.js$/,
		  use: [
			{
			  loader: 'babel-loader',
			  options: {
				presets: ['@babel/env'],
			  },
			},
		  ],
		},
		{
		  test: /\.(png|svg|jpg|jpeg|tiff|webp|gif|ico|woff|woff2|eot|ttf|otf|mp4|webm|wav|mp3|m4a|aac|oga)$/,
		  use: [
			{
			  loader: 'file-loader',
			  options: {
				context: 'src',
				name: '[path][name].[ext]',
			  },
			},
		  ],
		},
	  ],
	},
	// optimization: {
	//   splitChunks: {
	//     chunks: 'all',

	//     cacheGroups: {
	//       default: false,
	//       chunks: 'all',
	//     },
	//   },
	// },
	plugins: [
	  new MiniCssExtractPlugin({
		filename: 'style/global/[name].css',
		chunkFilename: '[name].css',
	  }),
	  new PurgecssPlugin({
		paths: () => glob.sync('./src/templates/**/*', { nodir: true }),
		only: ['structure'],
	  }),
	  new CopyPlugin({
		patterns: [
		  { from: './src/assets/icons', to: './assets/icons' },
		  { from: './src/assets/fonts', to: './assets/fonts' },
		],
	  }),
	  new CleanWebpackPlugin(),
	  new BrowserSyncPlugin(
		// BrowserSync options
		{
		  // browse to http://localhost:3000/ during development
		  host: 'localhost',
		  port: 3000,
		  // proxy the Mamp Server endpoint
		  proxy: 'https://pharmascience.local/',
		},
		{
		  reload: true,
		}
	  ),
	  new WatchTimePlugin(),
	],
  };
  //DEV
  if (argv.mode !== 'production') {
	config.module.rules.push({
	  test: /\.s?css$/,

	  use: [
		MiniCssExtractPlugin.loader,
		{
		  loader: 'css-loader', // translates CSS from JS
		  options: {
			sourceMap: true,
		  },
		},
		{
		  loader: 'postcss-loader',
		  options: {
			ident: 'postcss',
			plugins: [autoprefixer({})],
			sourceMap: true,
		  },
		},
		{
		  loader: 'sass-loader', // compiles Sass to CSS
		  options: {
			sourceMap: true,
			precision: 10,
		  },
		},
	  ],
	});
  }
  //PRODUCTION
  if (argv.mode === 'production') {
	config.module.rules.push({
	  test: /\.s?css$/,
	  use: [
		MiniCssExtractPlugin.loader,
		{
		  loader: 'css-loader',
		  options: {
			sourceMap: true,
		  },
		},
		{
		  loader: 'postcss-loader',
		  options: {
			ident: 'postcss',
			plugins: [
			  cssnano({
				preset: [
				  'default',
				  {
					discardComments: {
					  removeAll: true,
					},
				  },
				],
			  }),
			  autoprefixer({}),
			],
			sourceMap: true,
		  },
		},
		{
		  loader: 'sass-loader',
		  options: {
			sourceMap: true,
			precision: 10,
		  },
		},
	  ],
	});

	config.module.rules.push({
	  test: /\.svg$/,
	  enforce: 'pre',
	  use: [
		{
		  loader: 'svgo-loader',
		  options: {
			precision: 2,
			plugins: [
			  {
				removeViewBox: false,
			  },
			],
		  },
		},
	  ],
	});

	config.plugins.push(
	  new RemovePlugin({
		/**
		 * After compilation moves style related .js files to the trash
		 */
		after: {
		  test: [
			{
			  folder: 'dist/style/',
			  method: (absoluteItemPath) => {
				return new RegExp(/\.js$/).test(absoluteItemPath);
			  },
			  recursive: true,
			},
			{
			  folder: 'dist/style/',
			  method: (absoluteItemPath) => {
				return new RegExp(/\.js.map$/).test(absoluteItemPath);
			  },
			  recursive: true,
			},
		  ],
		},
	  })
	);
  }

  return config;
};
