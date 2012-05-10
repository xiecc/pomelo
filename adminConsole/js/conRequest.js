Ext.require('Ext.chart.*');
Ext.onReady(function(){

	Ext.BLANK_IMAGE_URL ='../ext-4.0.7-gpl/resources/themes/images/default/tree/s.gif'; 
	
   var conStore = Ext.create('Ext.data.Store', {
	id:'reqStoreId',
	autoLoad:false,
	pageSize:5,
    fields:['serverId','timeUsed','source','route','params','createTime','doneTime','cost(ms)','time'],
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'requests'
        }
    }
});
/**
 * gridPanel,detail message
 */
var conGrid=Ext.create('Ext.grid.Panel', {
	id:'conGridId',
	region:'center',
    store: conStore,
    columns:[
		// {header:'source',dataIndex:'source',width:150},
		{xtype:'rownumberer',width:40,sortable:false},
		{text:'time',dataIndex:'time',width:130},
		{text:'serverId',width:130,dataIndex:'serverId'},
		{text:'request route',dataIndex:'route',width:220},
		{text:'timeUsed',dataIndex:'timeUsed',width:70},
		{text:'request params',dataIndex:'params',width:900}
//		{header:'createTime',dataIndex:'createTime',width:200},
//		{header:'doneTime',dataIndex:'doneTime',width:200},
//		{header:'cost(ms)',dataIndex:'cost(ms)',width:800}
//		{header:'state',dataIndex:'state'}
		],
	tbar:[
		 'number: ',{
		 	xtype:'numberfield',
		 	name:'numberfield',
		 	id:'numberfieldId',
		 	anchor: '100%',
		 	value: 100,
        	maxValue: 1000,
        	minValue: 0,
		 	width:100
		 },' ',
		 // {
		 // 	xtype:'button',
		 // 	text:'latest 100logs',
		 // 	handler:getLatest
		 // },' ',
		 {
		 	xtype:'button',
		 	text:'refresh',
		 	handler:refresh
		 },' ',{
		 	xtype:'button',
		 	text:'count',
		 	handler:count
		 }
		]
	// listeners:{
	// 	dblclick:{
	// 		element: 'body',
	// 		fn:showDeails
	// 	}
	// }
});
var viewport=new Ext.Viewport({
	    layout:'border',
	    items:[{
	     region:'south',
         height:30,
         contentEl:countId
	    },conGrid]
	});

conGrid.addListener('itemdblclick', function(conGrid, rowindex, e){
	var theGrid=Ext.getCmp('conGridId');
	var record=conGrid.getSelectionModel().getSelection();
	if(record.length>1){
		alert('only one data is required!');
		return;
	}
	if(record.length<1){
		alert('please choose one data!')
	}
	var data=record[0].data.params;
	gridDetailShow(data);
});

});
   var conLogData=[];
   var n=0;
	socket.on('connect',function(){
		var number=Ext.getCmp('numberfieldId').getValue() ;
		socket.emit('announce_web_client');
		// socket.emit('webmessage');	
		socket.emit('con-log',{number:number,logfile:'con-log'});
		socket.on('con-log',function(msg){ 
		var data=msg.dataArray; 
		for(var i=0;i<data.length;i++){
			conLogData[n]=data[i];
			n++;
		}
	   var store=Ext.getCmp('conGridId').getStore();
       store.loadData(conLogData);
       
	  });
	});

//refresh conGrid's data
function refresh(){
	conLogData=[];
	n=0;
	var number=Ext.getCmp('numberfieldId').getValue() ;
	socket.emit('con-log',{number:number,logfile:'con-log'});
}
function count(){
	if(conLogData.length<1){
		return;
	}
	var maxTime=conLogData[0].timeUsed;
	var minTime=conLogData[0].timeUsed;
	var totalTime=0;
    for(var i=1;i<conLogData.length;i++){
    	var data=conLogData[i].timeUsed;
    	if(data<=minTime){minTime=data};
    	if(data>=maxTime){maxTime=data};
    	totalTime+=data;
    }
	document.getElementById("totalCountId").innerHTML=conLogData.length;
	document.getElementById("maxTimeId").innerHTML=maxTime;
	document.getElementById("minTimeId").innerHTML=minTime;
	document.getElementById("avgTimeId").innerHTML=totalTime/conLogData.length;
}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
