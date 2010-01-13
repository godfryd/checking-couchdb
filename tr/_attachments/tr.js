// -*- coding: utf-8 -*-
// Copyright (c) 2009 Michal Nowikowski. All rights reserved.

Ext.BLANK_IMAGE_URL = 'resources/images/default/s.gif';

function loadScenarios(scenariosStore, scenariosMap) {
    Ext.Ajax.request({
        url: "/tests-reporting/_design/reporting/_view/tools",
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var scenarios = [];
            var tools = {};
            Ext.each(t.rows, function(r) {
                if (r.key[1] == 0) { // tool
                    tools[r.key[0]] = r;
                } else { // scenario
                    scenarios.push([r.value.name, r.id, r.key[0]]); // scenario, scenario_id, tool_id
                }
            });
            Ext.each(scenarios, function(s) {
                var tool_id = s[2];
                s.unshift(tools[tool_id].value.name); // tool, scenario, scenario_id, tool_id
                scenariosMap[s[2]] = s;
            });
            scenariosStore.loadData(scenarios);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

function loadBuilds(buildsStore, buildMap) {
    Ext.Ajax.request({
        url: "/tests-reporting/_design/reporting/_view/builds",
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var builds = [];
            Ext.each(t.rows, function(r) {
                builds.push([r.id, r.key]);
                buildMap[r.id] = r.key;
            });
            buildsStore.loadData(builds);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

function loadBuildResults(buildId, scenariosMap, buildResStore) {
    Ext.Ajax.request({
        url: "/tests-reporting/_design/reporting/_view/results?key=\""+buildId+"\"",
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var results = [];
            Ext.each(t.rows, function(r) {
                var s = scenariosMap[r.value.scenario];
                for (var tc in r.value.results) {
                    results.push([s[0], s[1], tc, r.value.results[tc]]);
                }
            });
            buildResStore.loadData(results);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

function loadPassRate(passRateStore, scenariosMap, buildMap) {
    Ext.Ajax.request({
        url: "/tests-reporting/_design/reporting/_view/passrate",
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var passrate = [];
            Ext.each(t.rows, function(r) {
                var s = scenariosMap[r.value.scenario];
                passrate.push([r.key, buildMap[r.key], r.value.scenario, r.value.passed, r.value.total, s[0], s[1]]);
            });
            passRateStore.loadData(passrate);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

function load2Builds(build1Id, build2Id, scenariosMap, comparisonStore) {
    Ext.Ajax.request({
        method: "POST",
        url: "/tests-reporting/_design/reporting/_view/results",
        jsonData: {keys: [build1Id, build2Id]},
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var results = [];
            var testcases = {};
            Ext.each(t.rows, function(r) {
                var s = scenariosMap[r.value.scenario];
                for (var tc in r.value.results) {
                    var k = s[0] + s[1] + tc;
                    if (testcases[k] === undefined) {
                        testcases[k] = {tool: s[0], scen: s[1], tc: tc, builds: {}};
                    }
                    testcases[k].builds[r.value.build] = r.value.results[tc];
                }
            });
            for (var k in testcases) {
                var tc = testcases[k];
                var r1 = tc.builds[build1Id];
                var r2 = tc.builds[build2Id];
                if (r1 == "0" && r2 == "1") {
                    r2 = "<span style='background-color: #8f8;'>1</span>";
                } else if (r1 == "1" && r2 == "0") {
                    r2 = "<span style='background-color: #f88;'>0</span>";
                }
                results.push([tc.tool, tc.scen, tc.tc, r1, r2]);
            }
            comparisonStore.loadData(results);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

function loadBuildsRange(buildsIds, scenariosMap, trendsStore) {
    Ext.Ajax.request({
        method: "POST",
        url: "/tests-reporting/_design/reporting/_view/results",
        jsonData: {keys: buildsIds},
        success: function(response, options){
            var t = Ext.decode(response.responseText);
            var results = [];
            var testcases = {};
            Ext.each(t.rows, function(r) {
                var s = scenariosMap[r.value.scenario];
                for (var tc in r.value.results) {
                    var k = s[0] + s[1] + tc;
                    if (testcases[k] === undefined) {
                        testcases[k] = {tool: s[0], scen: s[1], tc: tc, builds: {}};
                    }
                    testcases[k].builds[r.value.build] = r.value.results[tc];
                }
            });
            for (var k in testcases) {
                var tc = testcases[k];
                var num = 0;
                var mean = 0;
                for (var b in tc.builds) {
                    mean += tc.builds[b];
                    num += 1;
                }
                mean = mean / num;
                results.push([tc.tool, tc.scen, tc.tc, mean]);
            }
            trendsStore.loadData(results);
        },
        failure: function(response, options){
            console.info("not ok");
        }
    });
}

Ext.onReady(function(){
    Ext.QuickTips.init();

    ////////////////////////////////
    //  Tools & Scenarios
    var scenariosStore = new Ext.data.ArrayStore({
        fields: ['tool', 'scenario', 'scenario_id', 'tool_id']
    });
    var scenariosMap = {};

    var scenColModel = new Ext.grid.ColumnModel([{
        header: "Tool",
        sortable: true,
        dataIndex: 'tool'
    }, {
        header: "Scenario",
        sortable: true,
        dataIndex: 'scenario'
    }]);

    var scenariosPanel = new Ext.grid.GridPanel({
        title: '1. Tools and Scenarios',
        border: false,
        store: scenariosStore,
        cm: scenColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                loadScenarios(scenariosStore, scenariosMap);
            }
        }]
    });

    ////////////////////////////////
    //  List of builds
    var buildsStore = new Ext.data.ArrayStore({
        fields: ['build_id', 'build']
    });
    var buildMap = {};

    var buildsColModel = new Ext.grid.ColumnModel([{
        header: "Build",
        sortable: true,
        dataIndex: 'build'
    }]);

    var buildsPanel = new Ext.grid.GridPanel({
        title: '2. Builds',
        border: false,
        store: buildsStore,
        cm: buildsColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                loadBuilds(buildsStore, buildMap);
            }
        }]
    });

    ////////////////////////////////
    //  Build results
    var buildResStore = new Ext.ux.data.PagingArrayStore({
        fields: ['tool', 'scenario', 'testcase', 'result'],
        lastOptions: {params: {start: 0, limit: 20}}
    });

    var buildResColModel = new Ext.grid.ColumnModel([{
        header: "Tool",
        sortable: true,
        dataIndex: 'tool'
    },{
        header: "Scenario",
        sortable: true,
        dataIndex: 'scenario'
    },{
        header: "Test case",
        sortable: true,
        dataIndex: 'testcase'
    },{
        header: "Result",
        sortable: true,
        dataIndex: 'result'
    }]);

    var buildResGrid = new Ext.grid.GridPanel({
        border: false,
        flex: 1,
        store: buildResStore,
        cm: buildResColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                var buildCmb = Ext.getCmp('build-cmb');                
                loadBuildResults(buildCmb.getValue(), scenariosMap, buildResStore);
            }
        }],
        bbar: new Ext.PagingToolbar({
            pageSize: 20,
            store: buildResStore,
            displayInfo: true,
            displayMsg: 'Displaying results {0} - {1} of {2}',
            emptyMsg: "No results to display"
        })
    });

    var buildResPanel = new Ext.Panel({
        title: '3. Test results of build',
        border: false,
        layout: 'vbox',
        items: [{
            border: false,
            xtype: 'form',
            padding: "4px 0 0 10px",
            items: [{
                id: 'build-cmb',
                xtype: 'combo',
                fieldLabel: 'Build',
                mode: 'local',
                triggerAction: 'all',
                store: buildsStore,
                valueField: 'build_id',
                displayField: 'build'
            }]
        }, buildResGrid]
    });

    ////////////////////////////////
    //  List of pass rate for builds
    var passRateStore = new Ext.data.ArrayStore({
        fields: ['build_id', 'build', 'scenario_id', 'passed', 'total', 'tool', 'scenario']
    });

    var passRateColModel = new Ext.grid.ColumnModel([{
        header: "Build",
        sortable: true,
        dataIndex: 'build'
    },{
        header: "Tool",
        sortable: true,
        dataIndex: 'tool'
    },{
        header: "Scenario",
        sortable: true,
        dataIndex: 'scenario'
    },{
        header: "Passed",
        sortable: true,
        dataIndex: 'passed'
    },{
        header: "Total",
        sortable: true,
        dataIndex: 'total'
    }]);

    var passRatePanel = new Ext.grid.GridPanel({
        title: '4. Pass rate',
        border: false,
        store: passRateStore,
        cm: passRateColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                loadPassRate(passRateStore, scenariosMap, buildMap);
            }
        }]
    });

    ////////////////////////////////
    //  Builds comparison
    var comparisonStore = new Ext.ux.data.PagingArrayStore({
        fields: ['tool', 'scenario', 'testcase', 'build1', 'build2'],
        lastOptions: {params: {start: 0, limit: 20}}
    });

    var comparisonColModel = new Ext.grid.ColumnModel([{
        header: "Tool",
        sortable: true,
        dataIndex: 'tool'
    },{
        header: "Scenario",
        sortable: true,
        dataIndex: 'scenario'
    },{
        header: "Test case",
        sortable: true,
        dataIndex: 'testcase'
    },{
        header: "Build 1",
        sortable: true,
        dataIndex: 'build1'
    },{
        header: "Build 2",
        sortable: true,
        dataIndex: 'build2'
    }]);

    var comparisonGrid = new Ext.grid.GridPanel({
        border: false,
        flex: 1,
        store: comparisonStore,
        cm: comparisonColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                var build1Cmb = Ext.getCmp('build1-cmb');                
                var build2Cmb = Ext.getCmp('build2-cmb');                
                load2Builds(build1Cmb.getValue(), build2Cmb.getValue(), scenariosMap, comparisonStore);
            }
        }],
        bbar: new Ext.PagingToolbar({
            pageSize: 20,
            store: comparisonStore,
            displayInfo: true,
            displayMsg: 'Displaying results {0} - {1} of {2}',
            emptyMsg: "No results to display"
        })
    });

    var comparisonPanel = new Ext.Panel({
        title: '5. Two builds comparison',
        border: false,
        layout: 'vbox',
        items: [{
            border: false,
            xtype: 'form',
            padding: "4px 0 0 10px",
            items: [{
                id: 'build1-cmb',
                xtype: 'combo',
                fieldLabel: 'Build 1',
                mode: 'local',
                triggerAction: 'all',
                store: buildsStore,
                valueField: 'build_id',
                displayField: 'build'
            },{
                id: 'build2-cmb',
                xtype: 'combo',
                fieldLabel: 'Build 2',
                mode: 'local',
                triggerAction: 'all',
                store: buildsStore,
                valueField: 'build_id',
                displayField: 'build'
            }]
        }, comparisonGrid]
    });

    ////////////////////////////////
    //  Builds trends
    var trendsStore = new Ext.ux.data.PagingArrayStore({
        fields: ['tool', 'scenario', 'testcase', 'mean'],
        lastOptions: {params: {start: 0, limit: 20}}
    });

    var trendsColModel = new Ext.grid.ColumnModel([{
        header: "Tool",
        sortable: true,
        dataIndex: 'tool'
    },{
        header: "Scenario",
        sortable: true,
        dataIndex: 'scenario'
    },{
        header: "Test case",
        sortable: true,
        dataIndex: 'testcase'
    },{
        header: "Mean",
        sortable: true,
        dataIndex: 'mean'
    }]);

    var trendsGrid = new Ext.grid.GridPanel({
        border: false,
        flex: 1,
        store: trendsStore,
        cm: trendsColModel,
        tbar: [{
            text: "Reload",
            handler: function() {
                var build1Id = Ext.getCmp('builda-cmb').getValue();                
                var build2Id = Ext.getCmp('buildb-cmb').getValue();
                var buildsIds = [];
                var inRange = false;
                for (var i = 0; i < buildsStore.getCount(); i++) {
                    var b = buildsStore.getAt(i);
                    if (b.get("build_id") == build1Id) {
                        inRange = true;
                    }
                    if (inRange) {
                        var bId = b.get("build_id");
                        buildsIds.push(bId);
                    }
                    if (b.get("build_id") == build2Id) {
                        inRange = false;
                    }
                }
                loadBuildsRange(buildsIds, scenariosMap, trendsStore);
            }
        }],
        bbar: new Ext.PagingToolbar({
            pageSize: 20,
            store: trendsStore,
            displayInfo: true,
            displayMsg: 'Displaying results {0} - {1} of {2}',
            emptyMsg: "No results to display"
        })
    });

    var trendsPanel = new Ext.Panel({
        title: '6. Results trends',
        border: false,
        layout: 'vbox',
        items: [{
            border: false,
            xtype: 'form',
            padding: "4px 0 0 10px",
            items: [{
                id: 'builda-cmb',
                xtype: 'combo',
                fieldLabel: 'First build',
                mode: 'local',
                triggerAction: 'all',
                store: buildsStore,
                valueField: 'build_id',
                displayField: 'build'
            },{
                id: 'buildb-cmb',
                xtype: 'combo',
                fieldLabel: 'Last build',
                mode: 'local',
                triggerAction: 'all',
                store: buildsStore,
                valueField: 'build_id',
                displayField: 'build'
            }]
        }, trendsGrid]
    });

    ///////////////////////////////////////////////
    // load initially stores
    loadScenarios(scenariosStore, scenariosMap);
    loadBuilds(buildsStore, buildMap);

    ///////////////////////////////////////////////
    // main tab panel
    var tabs = new Ext.TabPanel({
        activeTab: 0,
        items: [scenariosPanel, buildsPanel, buildResPanel, passRatePanel, comparisonPanel, trendsPanel]
    });
    
    var viewport = new Ext.Viewport({
        layout: 'fit',
        border: false,
        items: [tabs]
    });

});