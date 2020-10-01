"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_interface_1 = require("./testrail.interface");
var testrail_1 = require("./testrail");
var chalk = require('chalk');
var TestRailPromise = require("testrail-promise");
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        _this.results = [];
        var reporterOptions = options.reporterOptions;
        var runIdNew = null;
        _this.testRail = new testrail_1.TestRail(reporterOptions);
        _this.validate(reporterOptions, 'domain');
        _this.validate(reporterOptions, 'username');
        _this.validate(reporterOptions, 'password');
        _this.validate(reporterOptions, 'projectId');
        _this.validate(reporterOptions, 'suiteId');
        _this.testRailProm = new TestRailPromise("https://" + reporterOptions.domain, reporterOptions.username, reporterOptions.password);
        var pushingFunction = function (data, status, commentMessage) {
            if (reporterOptions.pushResultsToTestRail) {
                var sectionId_1 = null;
                var addSectionObj_1 = {
                    project_id: reporterOptions.projectId,
                    suite_id: reporterOptions.suiteId,
                    section_name: data.parent.title.trim(),
                    name: data.parent.title.trim(),
                    description: ''
                };
                _this.testRailProm.getSectionIdByName(addSectionObj_1).then(function (res) {
                    if (res !== null) {
                        sectionId_1 = res;
                    }
                    else {
                        _this.testRailProm.addSection(addSectionObj_1)
                            .then(function (newRes) {
                            sectionId_1 = newRes;
                        });
                    }
                    var addCaseObj = {
                        title: data.title.trim(),
                        project_id: reporterOptions.projectId,
                        suite_id: reporterOptions.suiteId,
                        section_id: sectionId_1,
                        refs: 'Cypress automation',
                        custom_automation_id: 'AUTO',
                        custom_automated: 1,
                        custom_test_team: 1,
                        custom_deprecated: 1,
                        custom_end_to_end: 1,
                        custom_integration_test: 1,
                    };
                    _this.testRailProm.ifNeededAddThenGetCaseId(addCaseObj).then(function (caseId) {
                        var newNewRequest = {
                            run_id: runIdNew.id,
                            case_id: caseId,
                            status_id: status,
                            comment: commentMessage,
                        };
                        _this.testRailProm.addResultForCase(newNewRequest);
                    });
                });
            }
        };
        runner.on('start', function () {
            if (reporterOptions.pushResultsToTestRail) {
                var executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
                var name_1 = (reporterOptions.runName || 'Automated test run') + " " + executionDateTime;
                var description = 'Cypress AutoPush';
                _this.testRail.createRun(name_1, description).then(function (runIdData) {
                    runIdNew = runIdData.data; // THIS MAKES NEW RUN AND RETURNS RUN_ID
                });
            }
        });
        runner.on('pass', function (test) {
            pushingFunction(test, testrail_interface_1.Status.Passed, "Execution time: " + test.duration + "ms");
        });
        runner.on('fail', function (test) {
            pushingFunction(test, testrail_interface_1.Status.Failed, "" + test.err.message);
        });
        runner.on('pending', function (test) {
            pushingFunction(test, testrail_interface_1.Status.Retest, "This test has .skip status, might be it needs refactoring");
        });
        runner.on('end', function () {
            if (reporterOptions.closeTestRun) {
                _this.testRail.closeRun(runIdNew.id);
            }
        });
        return _this;
    }
    CypressTestRailReporter.prototype.validate = function (options, name) {
        if (options == null) {
            throw new Error('Missing reporterOptions in cypress.json');
        }
        if (options[name] == null) {
            throw new Error("Missing " + name + " value. Please update reporterOptions in cypress.json");
        }
    };
    return CypressTestRailReporter;
}(mocha_1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
//# sourceMappingURL=cypress-testrail-reporter.js.map