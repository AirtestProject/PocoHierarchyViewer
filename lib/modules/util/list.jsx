
var React = require('react');
var MouseOverComponent = require('./mouseover');
var IconButton = require('./IconButton');
var DictUtil = require('./dictUtil');
var ArrayUtil = require('./arrayUtil');

import simplePinyin from 'simple-pinyin'
import linkState from 'react-link-state';
import {LinkedInput} from './LinkedInput'

class ListItem extends MouseOverComponent {
    constructor(props) {
        super(props);
        this.state = this.superState();
    }
    render() {
        var bgCls = this.state.mouseover ? 'color-primary-bg-light' :
                    this.props.active ? 'color-primary-bg-light-d1' : '';
        var style = Object.assign({padding: '5px', cursor: 'pointer'}, this.props.style);
        if (this.props.active) {
            style.color = 'white';
        }
        return <div style={style} className={bgCls} 
                    onClick={this.props.onClick} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
            {this.props.icon}        
            {this.props.text}
            <span style={{float: 'right'}}>{this.props.subButton}</span>
        </div>
    }
}

export class SelectableList extends React.Component {
    /*
     * props.values 结构 {'xxx': {key: 'xxx', value: 'yyy'}} xxx is the key, yyy is the value
     */

    constructor(props) {
        super(props);
        this.state = {
            searchConent: '',
        };
    }
    handleClickItem(val, id) {
        return () => {
            if (this.props.currentSelectedItemLink) {
                this.props.currentSelectedItemLink.requestChange({key: id, value: val});
            }
            if (this.props.onSelect) {
                this.props.onSelect(val, id);
            }
        }
    }
    filtering(dvalues, kw) {
        let identity = v => v
        let toText = this.props.toText || identity 
        var ditems = {};
        if (kw) {
            for (var i in dvalues) {
                var v = dvalues[i];
                var text = toText(v);
                if (text.indexOf(kw) >= 0) {
                    ditems[i] = v;
                } else {
                    var py = simplePinyin(text, {pinyinOnly: false})
                    if (py.map(p => p[0]).join('').indexOf(kw) >= 0) {
                        ditems[i] = v;
                    } else {
                        if (py.join('').indexOf(kw) >= 0) {
                            ditems[i] = v;
                        }
                    }
                }
            }
        } else {
            ditems = dvalues;
        }
        return ditems;
    }
    render() {
        let identity = v => v
        let toText = this.props.toText || identity 

        // filtering
        var ditems = this.filtering(this.props.values, this.state.searchConent);

        // sorting
        var items = DictUtil.values(ditems);
        items = items.sort(this.props.sorter || ArrayUtil.localeSorter(toText));

        // to instance
        items = $.map(items, (val, _id) => {
            var id = (val.id || _id) + '';
            var itemStyle = this.props.itemStyler ? this.props.itemStyler(val, id) : {};
            var itemIcon = this.props.itemIconer ? this.props.itemIconer(val, id): null;
            if (this.props.currentSelectedItemLink.value && id === this.props.currentSelectedItemLink.value.key) {
                var subButton = this.props.subButtonCreator ? this.props.subButtonCreator(val, id) : null;
                return <ListItem key={id} text={toText(val)} onClick={this.handleClickItem(val, id)} style={itemStyle} icon={itemIcon} subButton={subButton} active />
            } else {
                return <ListItem key={id} text={toText(val)} onClick={this.handleClickItem(val, id)} style={itemStyle} icon={itemIcon} />
            }
        });
        return <div style={this.props.style || {padding: '10px'}}>
            <div style={{marginTop: '5px'}}>
                <LinkedInput valueLink={linkState(this, 'searchConent')} className='form-control has-success' placeholder='search' style={{display: 'inline', lineHeight: 1, height: '25px', paddingLeft: '5px'}} />
            </div>
            <div>
                {this.props.itemAdder}
                {this.props.itemUpdater}
            </div>
            <div style={{marginTop: '5px'}}>
                {items}
            </div>
        </div>
    }
}

