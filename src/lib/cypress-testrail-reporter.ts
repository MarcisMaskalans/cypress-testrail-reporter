import {reporters} from 'mocha';
import * as moment from 'moment';
import {Status, TestRailResult} from './testrail.interface';
import {TestRail} from "./testrail";

const chalk = require('chalk');
const TestRailPromise = require("testrail-promise");

export class CypressTestRailReporter extends reporters.Spec {
    private results: TestRailResult[] = [];
    private testRail: TestRail;
    private testRailProm;

    constructor(runner: any, options: any) {
        super(runner);

        let reporterOptions = options.reporterOptions;
        let runIdNew = null;
        this.testRail = new TestRail(reporterOptions);
        this.validate(reporterOptions, 'domain');
        this.validate(reporterOptions, 'username');
        this.validate(reporterOptions, 'password');
        this.validate(reporterOptions, 'projectId');
        this.validate(reporterOptions, 'suiteId');
        this.testRailProm = new TestRailPromise(`https://${reporterOptions.domain}`, reporterOptions.username, reporterOptions.password);

        let pushToTestRail = (data, status: Status, commentMessage: string) => {
            if (reporterOptions.pushResultsToTestRail) {
                let sectionId = null;
                let addSectionObj = {
                    project_id: reporterOptions.projectId,
                    suite_id: reporterOptions.suiteId,
                    section_name: data.parent.title.trim(),
                    name: data.parent.title.trim(),
                    description: ''
                };

                this.testRailProm.getSectionIdByName(addSectionObj).then((res) => {
                    if (res !== null) {
                        sectionId = res;
                    } else {
                        this.testRailProm.addSection(addSectionObj)
                            .then((newRes) => {
                                sectionId = newRes;
                            })
                    }
                    let addCaseObj = {
                        title: data.title.trim(),
                        project_id: reporterOptions.projectId,
                        suite_id: reporterOptions.suiteId,
                        section_id: sectionId,
                        refs: 'Cypress automation',
                        custom_automation_id: 'Cypress',
                        custom_automated: 1,
                        custom_test_team: 1,
                        custom_deprecated: 1,
                        custom_end_to_end: 1,
                        custom_integration_test: 1,
                    };
                    this.testRailProm.ifNeededAddThenGetCaseId(addCaseObj).then((caseId) => {
                        let newNewRequest = {
                            run_id: runIdNew.id,
                            case_id: caseId,
                            status_id: status,
                            comment: commentMessage,
                        };
                        this.testRailProm.addResultForCase(newNewRequest);
                    });
                })
            }
        };

        runner.on('start', () => {
            if (reporterOptions.pushResultsToTestRail) {
                const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
                const name = `${reporterOptions.runName || 'Automated test run'} ${executionDateTime}`;
                const description = 'Cypress auto publish from https://github.com/MarcisMaskalans/cypress-testrail-reporter';
                this.testRail.createRun(name, description).then((runIdData) => {
                    runIdNew = runIdData.data; // THIS MAKES NEW RUN AND RETURNS RUN_ID
                });
            }
        });

        runner.on('pass', test => {
            pushToTestRail(test, Status.Passed, `Execution time: ${test.duration}ms`);
        });

        runner.on('fail', test => {
            pushToTestRail(test, Status.Failed, `${test.err.message}`);
        });

        runner.on('pending', test => {
            pushToTestRail(test, Status.Retest, `This test has .skip status, might be it needs refactoring`);
        });

        runner.on('end', () => {
            if (reporterOptions.closeTestRun) {
                this.testRail.closeRun(runIdNew.id);
            }
        });
    }

    private validate(options, name: string) {
        if (options == null) {
            throw new Error('Missing reporterOptions in cypress.json');
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
        }
    }
}
