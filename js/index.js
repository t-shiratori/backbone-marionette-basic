/*global Backbone */

//console.log(Marionette);

var TodoMVC = TodoMVC || {};

(function () {
	'use strict';



	/*-- アプリケーションクラス作成
	---------------------------------------------------------------*/
	TodoMVC.TodoApp = Marionette.Application.extend({
		setRootLayout: function () {
			this.root = new TodoMVC.RootLayout();
		}
	});

	/*-- モデルクラス作成
	---------------------------------------------------------------*/
	TodoMVC.TodoModel = Backbone.Model.extend({
		defaults: {
			title: '',
			completed: false
		}
	});

	/*-- コレクションクラス作成
	---------------------------------------------------------------*/
	TodoMVC.ToDoCollection = Backbone.Collection.extend({
		model: TodoMVC.TodoModel,
		getCompleted: function(){
			var filterd = this.filter(function (model) {
				if(model.get('completed')){
				   return model;
			   	}
			});
			return filterd;
		}
	});

	/*-- レイアウトビュークラス作成
	---------------------------------------------------------------*/
	TodoMVC.RootLayout = Marionette.LayoutView.extend({
		el: '#todoapp',
		regions: {
			toDoApp__addUi: '.toDoApp__addUi',
			toDoApp__main: '.toDoApp__main',
			toDoApp__dataUi: '.toDoApp__dataUi'
		}
	});

	/*-- ルータークラス作成
	---------------------------------------------------------------*/
	TodoMVC.Router = Marionette.AppRouter.extend({
		//appRoutesはcontrollerにメソッドを持たせたいときに使う
		appRoutes: {
			'': 'rootMethod',			//#
			'hoge': 'hogeMethod',		//#hoge
			'search/:query': 'search'	//#search/検索文字列
		}
	});

	/*-- アイテムビュークラス：addUi部分
	---------------------------------------------------------------*/
	TodoMVC.AddUi = Marionette.ItemView.extend({
		template: Handlebars.compile($('#template-toDoApp__addUi').html()),
		ui: {
			inputTxt: '.toDoApp__addUi__txt',
			btnAdd: '.toDoApp__addUi__btnAdd'
		},
		model: new Backbone.Model(),
		events: {
			'click @ui.btnAdd': 'addModel'
		},
		initialize: function(){
			this.model.regexp = {
				chk01 :  function(txt){
						if(/\d/.test(txt)){
							alert('数字は使えません');
							return true;
						}
				},
				chk02 :  function(txt){
						if(txt === ''){
							alert('何か入力してください');
							return true;
						}
				}
			};
		},
		clickedButton: function(e) {
			e.preventDefault();
		},
		addModel: function(e) {
			e.preventDefault();
			var inputTxt = this.ui.inputTxt.val();

			//バリデーション
			if(this.model.regexp.chk01(this.ui.inputTxt.val())) return false;
			if(this.model.regexp.chk02(this.ui.inputTxt.val())) return false;

			//新規モデルを作ってコレクションに追加
			var model = new TodoMVC.TodoModel();
			model.set('title',inputTxt);
			this.collection.add(model);
			this.ui.inputTxt.val('');
		}
	});

	/*-- アイテムビュークラス：リスト
	---------------------------------------------------------------*/
	TodoMVC.ListView = Marionette.ItemView.extend({
		tagName: 'li',
		className: 'toDoApp__li',
		template: Handlebars.compile($('#template-toDoApp__list').html()),
		ui: {
			chkBox: '.toDoApp__list__chk',
			btnDel: '.btnDel'
		},
		events: {
			'change @ui.chkBox': 'statusUpdate',
			'click @ui.btnDel': 'delModel'
		},
		initialize: function(){
			this.model.set('itemId',this.model.cid);
		},
		delModel: function(e) {
			e.preventDefault();
			this.remove();
			this.model.destroy();//これだけでコレクションからも削除される
		},
		statusUpdate: function(e){
			//モデルのcompletedの値を更新
			this.model.set('completed',this.ui.chkBox.prop('checked'));
		}
	});

	/*-- コンポジットビュークラス：メイン部分
	---------------------------------------------------------------*/
	TodoMVC.ToDoMain = Marionette.CompositeView.extend({
		childView: TodoMVC.ListView,//ひとつのmodelに対応するview
    	childViewContainer: '.toDoApp__listBox',//collectionに入っているmodelの数だけchildViewが作られてchildViewContainerの中にアウトプットされる
		template: Handlebars.compile($('#template-toDoApp__main').html()),
		ui: {
			btnDelChked: '.btnDelChked',
			btnRouterRoot: '.btnRouterRoot',
			btnRouterHoge: '.btnRouterHoge',
			btnRouterSearch: '.btnRouterSearch'
		},
		events: {
			'click @ui.btnDelChked': 'delChecked',
			'click @ui.btnRouterRoot': 'transitionRoot',
			'click @ui.btnRouterHoge': 'transitionHoge',
			'click @ui.btnRouterSearch': 'transitionSearch'
		},
		initialize: function() {
			this.listenTo(this.collection, 'add', function(){
				this.render();
			});
		},
		delChecked: function() {
			//チェックがついてるもの = modelのcopmleteがtrueのものだけを削除する
			var compModels = this.collection.getCompleted();
			this.collection.remove(compModels);
			this.render();
		},
		transitionRoot :function(){
			Backbone.history.navigate('#', true);
		},
		transitionHoge :function(){
			Backbone.history.navigate('#hoge', true);
		},
		transitionSearch :function(){
			Backbone.history.navigate('#search/queryString', true);
		}
	});

	/*-- ビュークラス：データUI部分
	---------------------------------------------------------------*/
	TodoMVC.DataView = Marionette.ItemView.extend({
		tagName: 'table',
		className: 'toDoApp__dataTable',
		template: Handlebars.compile($('#template-dataView').html()),
		model: new Backbone.Model(),
		initialize: function () {
			var _self = this;
			this.resetData();
			this.listenTo(this.collection, 'update change', function(){
				//参照 http://backbonejs.org/#Events-listenTo
				//updateはcollectionの変更イベント
				//changeはモデルの変更イベント
				this.resetData();
				this.render();
			});
		},
		resetData: function(){
			var compModels = this.collection.getCompleted();
			this.model.set({'sum': this.collection.length});
			this.model.set({'compNum': compModels.length});
		}
	});


	/*-- オブジェクトクラス作成：コントローラー用
	---------------------------------------------------------------*/
	TodoMVC.Controller = Marionette.Object.extend({

		initialize: function () {
			//初期データ
			var models = [
				{title: 'huga'},
				{title: 'fds'},
				{title: 'mmfjfu'}
			];
			this.todoCollection = new TodoMVC.ToDoCollection(models);
		},
		start: function () {
			this.showAddUi(this.todoCollection);
			this.showMain(this.todoCollection);
			this.showDataUi(this.todoCollection);
		},
		showAddUi: function (todoCollection) {
			var toDoApp__addUi = new TodoMVC.AddUi({
				collection: todoCollection
			});
			TodoMVC.app.root.showChildView('toDoApp__addUi', toDoApp__addUi);
		},
		showMain: function (todoCollection) {
			var toDoApp__main = new TodoMVC.ToDoMain({
				collection: todoCollection
			});
			TodoMVC.app.root.showChildView('toDoApp__main', toDoApp__main);
		},
		showDataUi: function (todoCollection) {
			var dataView = new TodoMVC.DataView({
				collection: todoCollection
			});
			TodoMVC.app.root.showChildView('toDoApp__dataUi', dataView);
		},
		rootMethod: function(){
			TodoMVC.app.root.toDoApp__addUi.$el.css({
				'background-color': '#ccc'
			});
		},
		hogeMethod: function(){
			TodoMVC.app.root.toDoApp__addUi.$el.css({
				'background-color': '#999'
			});
		},
		search: function(q){
			alert(q);
		}
	});




	/*---------------------------------------------------------------

		アプリ生成

	---------------------------------------------------------------*/
	TodoMVC.app = new TodoMVC.TodoApp();

	TodoMVC.app.on('before:start', function () {
		TodoMVC.app.setRootLayout();
	});

	TodoMVC.app.on('start', function() {
		var controller = new TodoMVC.Controller();
		TodoMVC.router = new TodoMVC.Router({
			//constructorプロパティにcontrollerを渡すことでcontrollerで定義したメソッドがrouterから使えるようになる
			controller: controller
		});
		controller.start();
		Backbone.history.start({pushState: true, root: "/"});//routerの有効化
	});



})();








$(function() {

	/*-- アプリ起動
	---------------------------------------------------------------*/
    TodoMVC.app.start();

});
