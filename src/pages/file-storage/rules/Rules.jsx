import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga';
import { connect } from 'react-redux';
import store from '../../../store'
import '../../../index.css';
import Sidenav from '../../../components/sidenav/Sidenav';
import Topbar from '../../../components/topbar/Topbar';
import Header from '../../../components/header/Header';
import Documentation from '../../../components/documentation/Documentation';
import EmptyState from '../../../components/rules/EmptyState';
import rulesImg from '../../../assets/rules.svg';
import RulesComponent from '../../../components/rules/Rules';
import ConfigurationForm from "../../../components/file-storage/ConfigurationForm"
import { get, set, push } from "automate-redux";

const Rules = (props) => {
	const [modalVisible, setModalVisibility] = useState(false)
	useEffect(() => {
		ReactGA.pageview("/projects/file-storage/rules");
	}, [])
	const noOfRules = props.rules.length
	return (
		<div>
			<Topbar showProjectSelector />
			<div className="flex-box">
				<Sidenav selectedItem="file-storage" />
				<div className="page-content">
					<div className="header-flex">
						<Header name="Rules" color="#000" fontSize="22px" />
						<Documentation url="https://docs.spaceuptech.com/file-storage" />
					</div>
					{modalVisible && <ConfigurationForm
					  handleSubmit={props.saveConfig}
						handleCancel={() => setModalVisibility(false)} />}
					{noOfRules > 0 && <RulesComponent
						array={true}
						rules={props.rules}
						handleRuleChange={props.handleRuleChange}
						addText={'Add a rule'}
						handleAddRuleClick={props.handleCreateRule}
						handleDeleteRule={props.handleDeleteRule}
					/>}
					{!noOfRules && <EmptyState
						graphics={rulesImg} desc="Guard your data with rules that define who has access to it and how it is structured."
						buttonText="Add a rule"
						handleClick={props.handleCreateRule} />}
				</div>
			</div>
		</div>
	)
}

const mapStateToProps = (state) => {
	const c = get(state, `config.modules.fileStore`, {})
	const rules = get(state, `config.modules.fileStore.rules`, [])

	return {
		config: { storeType: c.storeType, bucket: c.bucket, conn: c.conn, endpoint: c.endpoint },
		rules: rules
	}
};

const mapDispatchToProps = (dispatch) => {
	return {
		handleRuleChange: (index, value) => {
			let rules = get(store.getState(), "config.modules.fileStore.rules", []).slice()
			rules[index] = value
			dispatch(set(`config.modules.fileStore.rules`, rules))
		},
		handleDeleteRule: (index) => {
			const rules = get(store.getState(), `config.modules.fileStore.rules`, []).filter((o, i) => i !== index)
			dispatch(set(`config.modules.fileStore.rules`, rules))
		},
		handleCreateRule: () => {
			const defaultRule = {
				prefix: "/",
				rule: {
					create: {
						rule: "allow"
					},
					read: {
						rule: "allow"
					},
					delete: {
						rule: "allow"
					}
				}
			}
			dispatch(push(`config.modules.fileStore.rules`, JSON.stringify(defaultRule, null, 2)))
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Rules);
