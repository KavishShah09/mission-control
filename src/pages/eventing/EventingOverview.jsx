import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import ReactGA from 'react-ga';
import { useSelector } from 'react-redux';
import { Table, Button, Alert, Row, Col } from "antd"
import '../../index.css';
import Sidenav from '../../components/sidenav/Sidenav';
import Topbar from '../../components/topbar/Topbar';
import RuleForm from "../../components/eventing/RuleForm";
import EventTabs from "../../components/eventing/event-tabs/EventTabs";
import { getEventSourceFromType, notify, getEventSourceLabelFromType, incrementPendingRequests, decrementPendingRequests } from '../../utils';
import eventingSvg from "../../assets/eventing.svg"
import './event.css'
import history from "../../history"
import { deleteEventingTriggerRule, saveEventingTriggerRule, getEventingTriggerRules, getEventingConfig } from '../../operations/eventing';
import { getDbConfigs } from '../../operations/database';
import { projectModules, actionQueuedMessage } from '../../constants';


const EventingOverview = () => {
	// Router params
	const { projectID } = useParams()

	useEffect(() => {
		ReactGA.pageview("/projects/eventing/overview");
	}, [])

	// Global state
	const rules = useSelector(state => getEventingTriggerRules(state))
	const dbConfigs = useSelector(state => getDbConfigs(state))
	const eventingConfig = useSelector(state => getEventingConfig(state))


	// Component state
	const [ruleModalVisible, setRuleModalVisibile] = useState(false)
	const [ruleClicked, setRuleClicked] = useState("")

	// Derived state
	const dbList = Object.keys(dbConfigs)
	const rulesTableData = Object.entries(rules).map(([id, { type }]) => ({ id, type }))
	const noOfRules = rulesTableData.length
	const ruleClickedInfo = ruleClicked ? { id: ruleClicked, ...rules[ruleClicked] } : undefined
	const eventingConfigured = eventingConfig.enabled && eventingConfig.dbAlias

	// Handlers
	const handleEditRuleClick = (id) => {
		setRuleClicked(id)
		setRuleModalVisibile(true)
	}

	const handleTriggerRuleClick = (eventType) => {
		history.push(`/mission-control/projects/${projectID}/eventing/queue-event`, { eventType })
	}

	const handleRuleModalCancel = () => {
		setRuleClicked("")
		setRuleModalVisibile(false)
	}

	const handleSetRule = (id, type, url, retries, timeout, options = {}, requestTemplate, outputFormat) => {
		const isRulePresent = rules[id] ? true : false
		return new Promise((resolve, reject) => {
			incrementPendingRequests()
			saveEventingTriggerRule(projectID, id, type, url, retries, timeout, options, requestTemplate, outputFormat)
				.then(({ queued }) => {
					notify("success", "Success", queued ? actionQueuedMessage : `${isRulePresent ? "Modified" : "Added"} trigger rule successfully`)
					resolve()
				})
				.catch(ex => {
					notify("error", `Error ${isRulePresent ? "Modifying" : "Adding"} trigger rule`, ex)
					reject()
				})
				.finally(() => decrementPendingRequests())
		})
	}

	const handleDeleteRule = (id) => {
		incrementPendingRequests()
		deleteEventingTriggerRule(projectID, id)
			.then(({ queued }) => notify("success", "Success", queued ? actionQueuedMessage : "Deleted trigger rule successfully"))
			.catch(ex => notify("error", "Error deleting trigger rule", ex))
			.finally(() => decrementPendingRequests())
	}

	const columns = [
		{
			title: 'Name',
			dataIndex: 'id'
		},
		{
			title: 'Source',
			key: 'source',
			render: (_, record) => getEventSourceLabelFromType(record.type)
		},
		{
			title: 'Actions',
			className: 'column-actions',
			render: (_, record) => {
				const source = getEventSourceFromType(record.type)
				return (
					<span>
						<a onClick={() => handleEditRuleClick(record.id)}>Edit</a>
						{source === "custom" && <a onClick={() => handleTriggerRuleClick(record.type)}>Trigger</a>}
						<a style={{ color: "red" }} onClick={() => handleDeleteRule(record.id)}>Delete</a>
					</span>
				)
			}
		}
	]

  const alertMsg = <div>
    <span>Head over to the </span>
    <Link to={`/mission-control/projects/${projectID}/eventing/settings`}>Eventing Settings tab</Link>
    <span> to configure eventing.</span>
  </div>

	const dbAlert = () => {
		if (!eventingConfigured)
			return (
				<Row>
					<Col lg={{ span: 18, offset: 3 }}>
						<Alert style={{ top: 15 }}
							message={`Eventing needs to be configured${eventingConfig.enabled ? " properly" : ""}`}
							description={alertMsg}
							type="info"
							showIcon
						/>
					</Col>
				</Row>
			)
	}

	return (
		<div>
			<Topbar showProjectSelector />
			<Sidenav selectedItem={projectModules.EVENTING} />
			<div className='page-content page-content--no-padding'>
				<EventTabs activeKey="overview" projectID={projectID} />
				<div className="event-tab-content">
					{noOfRules === 0 && <div>
						<div className="panel">
							<img src={eventingSvg} />
							<p className="panel__description" style={{ marginTop: 48, marginBottom: 0 }}>Trigger asynchronous business logic reliably on any events via the eventing queue in Space Cloud. <a href="https://docs.spaceuptech.com/microservices/eventing">View Docs.</a></p>
							<Button style={{ marginTop: 16 }} type="primary" className="action-rounded" onClick={() => setRuleModalVisibile(true)} disabled={!eventingConfigured}>Add first event trigger</Button>
							{dbAlert()}
						</div>
					</div>}
					{noOfRules > 0 && (
						<React.Fragment>
							<h3 style={{ display: "flex", justifyContent: "space-between" }}>Event Triggers <Button onClick={() => setRuleModalVisibile(true)} type="primary">Add</Button></h3>
							<Table columns={columns} dataSource={rulesTableData} rowKey="id" />
						</React.Fragment>
					)}
					{ruleModalVisible && <RuleForm
						handleCancel={handleRuleModalCancel}
						handleSubmit={handleSetRule}
						dbList={dbList}
						initialValues={ruleClickedInfo} />}
				</div>
			</div>
		</div>
	)
}

export default EventingOverview;
