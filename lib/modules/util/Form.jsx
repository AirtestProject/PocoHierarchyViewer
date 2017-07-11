
var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Row = ReactBootstrap.Row;
var Col = ReactBootstrap.Col;
var DropdownSelection = require('./DropdownSelection.js').DropdownSelection;
var CB = require('./Checkbox');
import {LinkedInput} from './LinkedInput'


export class LabeledInput extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var inputWith = this.props.selections ? 80 : 100;
        return (
            <Row style={{margin: 0}}>
                <Col md={3} style={{paddingTop: '7px'}} className={this.props.required ? 'color-primary' : ''}>
                    {this.props.label}
                </Col>
                <Col md={9}>
                    {this.props.readOnly &&
                        <span>{this.props.value || this.props.valueLink.value}</span> 
                    }
                    {!this.props.readOnly &&
                        <LinkedInput className='form-control text-primary' type='text' 
                            placeholder={this.props.placeholder || ''} 
                            valueLink={this.props.valueLink} 
                            value={this.props.value} 
                            style={{width: inputWith + '%', display: 'inline'}} />
                    }
                    {!this.props.readOnly && this.props.selections &&
                        <DropdownSelection valueLink={this.props.valueLink} selections={this.props.selections} size='sm' pullRight />
                    }
                </Col>
            </Row>
        );
    }
}


export class TinyLabeledInput extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var inputWith = this.props.selections ? 90 : 100;
        return (
            <Row style={{margin: 0}}>
                <Col md={3} style={{padding: '0 0 5px 0'}} className={this.props.required ? 'color-primary' : ''}>
                    {this.props.label}
                </Col>
                <Col md={9} style={{padding: '0 0 5px 5px'}}>
                    {this.props.readOnly &&
                        <span>{this.props.value || this.props.valueLink.value}</span> 
                    }
                    {!this.props.readOnly &&
                        <LinkedInput className='form-control text-primary' type='text' 
                                placeholder={this.props.placeholder || ''} 
                                valueLink={this.props.valueLink} 
                                value={this.props.value} 
                                style={{height: '20px', fontSize: '14px', width: inputWith + '%', display: 'inline'}} />
                    }
                    {!this.props.readOnly && this.props.selections &&
                        <DropdownSelection valueLink={this.props.valueLink} selections={this.props.selections} size='xs' pullRight />
                    }
                </Col>
            </Row>
        );
    }
}


export class Checkbox extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        return (
            <Row style={{margin: 0}}>
                <Col md={3} style={{padding: '0 0 5px 0'}} className={this.props.required ? 'color-primary' : ''}>
                    {this.props.label}
                </Col>
                <Col md={9} style={{padding: '0 0 5px 5px'}}>
                    <CB style={{margin: 0}} readOnly={this.props.readOnly} checkedLink={this.props.checkedLink} label='' />
                </Col>
            </Row>
        )
    }
}

