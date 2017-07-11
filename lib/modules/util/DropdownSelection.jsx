
const _ = require('lodash')
const React = require('react')

import autoBind from 'react-autobind'

export class DropdownSelection extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this)
    }

    handleSelect(val, i) {
        return () => {
            if (this.props.onSelect) {
                this.props.onSelect(val, i)
            }
            if (this.props.valueLink) {
                this.props.valueLink.requestChange(val)
            }
        }
    }

    render() {
        var selections = $.map(this.props.selections, (val, i) => {
            return <li key={i}><a onClick={this.handleSelect(val, i)}>{val}</a></li>
        })
        var btnSize = 'btn-' + (this.props.size || 'sm');
        return (
            <div className={'btn-group ' + (this.props.dropup ? 'dropup' : '')} style={{margin: 0}}>
                <a className={['btn', 'btn-flat', 'dropdown-toggle', btnSize].join(' ')} data-toggle='dropdown' style={{margin: 0}}><span className='caret'></span></a>
                <ul className={'dropdown-menu ' + (this.props.pullRight ? 'dropdown-menu-right' : '')}>
                    {selections}
                </ul>
            </div>
        );
    }
}


// this class of dropdown is not allowed to modify value of the selections
export class DropdownSelectionFixed extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
        autoBind(this)

        let initVal = this.props.initialValue
        if (initVal) {
            if (_.isObjectLike(initVal)) {
                let initKey = Object.keys(initVal)[0]
                this.state.value = initVal[initKey]
                this.state.key = initKey
            } else {
                this.state.value = initVal
            }
        }
    }

    handleSelect(val, i) {
        return () => {
            if (this.props.onSelect) {
                this.props.onSelect(val, i);
            }
            if (this.props.valueLink) {
                this.props.valueLink.requestChange(val);
            }
            this.setState({value: val, key: i})
        }
    }
    render() {
        let toText = this.props.toText || _.identity
        var btnSize = ' btn-' + (this.props.size || 'xs');
        return (
            <div className={"btn-group " + (this.props.dropup ? 'dropup': '')} style={Object.assign({margin: 0}, this.props.style)}>
                <a data-target="#" className={['btn', 'btn-default', 'dropdown-toggle', btnSize].join(' ')} style={Object.assign({textTransform: 'none'}, this.props.btnStyle)} data-toggle="dropdown">
                    {this.props.icon && <i className={this.props.icon} style={Object.assign({fontSize: '22px', verticalAlign: 'sub'}, this.props.iconStyle)}></i>}
                    <span>{toText(this.props.valueLink ? this.props.valueLink.value : this.state.value)}</span>
                    <span className="caret"></span>
                </a>
                <ul className="dropdown-menu">
                    {function () {
                        var options = $.map(this.props.selections, (val, i) => {
                            return <li key={i} ><a onClick={this.handleSelect(val, i)}>{toText(val)}</a></li>
                        });
                        return options;
                    }.bind(this) ()}
                </ul>
            </div> 
        )
    }
}

