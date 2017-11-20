
import React from 'react'

import IconButton from '../../util/IconButton'

export class ToolBarButton extends React.Component {
	render() {
 	   	return <IconButton onClick={this.props.onClick} 
 	   				       btnClass={this.props.btnClass || '-'} 
 	   				       iconStyle={{fontSize: '20px'}} 
 	   				       btnStyle={{marginRight: '4px'}} 
 	   				       icon={this.props.icon} 
 	   				       hint={this.props.hint} 
 	   				       hintPlacement='bottom' />
	}
}
