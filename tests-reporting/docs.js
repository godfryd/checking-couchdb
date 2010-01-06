var test_tool = {
    type: 'tool', 
    name: 'tool1'
};
var test_scenario = {
    type: 'scenario', 
    tool: &lt;tool_id&gt;, 
    cmd: 'run ...'
};
var build = {
    type: 'build', 
    name: 'build_001'
};
var test_job = {
    type: 'job', 
    build: &lt;build_id&gt;,
    scenario: &lt;scenario_id&gt;, 
    results: {
        tc_1: 1, 
        tc_2: 0
    }
};