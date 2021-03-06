import React, { Component } from 'react';
import moment from 'moment';
import { Breadcrumb, Button, message, DatePicker } from 'antd';
import AsyncComponent from '../../views/asyncComponent.js';

const RateExpandedTable = AsyncComponent(() => import('./rateExpandedTable')
    .then(component => component.default));

const { MonthPicker } = DatePicker;

const defaultMonth = moment().format('YYYY-MM');

export default class Rates extends Component {

    state = {
        dataSource: [],
        sortedInfo: null,
        month: defaultMonth
    };

    clearSorters = () => {
        this.setState({
            sortedInfo: null
        });
    };

    getDataSource = ()=> {
        const _component = this;

        let { month } = this.state;

        month = month || defaultMonth;

        let reportUrl = '/console/rates/report/month/' + month;

        _component.setState({loading: true});

        fetch(reportUrl)
            .then((res)=>res.json())
            .then(function (data) {

                if (200 === data.code) {

                    data.msg.forEach(function (item) {
                        item.key = item.csid;
                    });

                    _component.setState({
                        dataSource: data.msg
                    });
                } else {
                    message.error(data.msg, 4);
                }
            }).catch(function (e) {
                message.error(e.message, 4);
            });
    };

    componentWillMount () {
        const location = this.props.location;
        if (location.state) {
            this.setState({month: location.state.month});
        }
    };

    componentDidMount () {
        this.getDataSource();
    };

    handleChange = (pagination, filters, sorter) => {
        this.setState({
            sortedInfo: sorter
        });
    };

    handleMonthPickerChange = (date, dateString) => {
        this.setState({
            month: dateString
        }, this.getDataSource);
    };

    render() {
        let { dataSource,sortedInfo, month } = this.state;
        sortedInfo = sortedInfo || {};

        let defaultPickerMonth = moment(month);

        return (
            <div>
                <Breadcrumb separator=">">
                    <Breadcrumb.Item>Rate Report</Breadcrumb.Item>
                </Breadcrumb>

                <div className="content-body">
                    <div className="table-deals">
                        <div className="table-search">
                            <MonthPicker onChange={ this.handleMonthPickerChange } defaultValue={ defaultPickerMonth }
                                         placeholder="Select month"/>
                        </div>
                        <div className="table-operations">

                            <Button onClick={this.clearSorters}>Clear sorters</Button>
                        </div>
                    </div>

                    <RateExpandedTable
                        dataSource={ dataSource }
                        sortedInfo={ sortedInfo }
                        month={ month || defaultMonth }
                        onChange={ this.handleChange }/>
                </div>
            </div>
        );
    }
}