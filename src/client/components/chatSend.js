import React, { Component } from 'react';
import { Input, Icon, Upload, message, Modal, Progress } from 'antd';
import ChatShortcut from './chatSendShortcut';
import EmojiPicker from './chatEmoji';
import {cutStr} from './utils';

let shortListIndex=0;

class ChatSend extends Component{

    constructor(props){
        super(props);
        this.state = {
            isSendReady: false,
            isEmojiShow: false,
            socket: props.socket,
            isShowProcess: false,
            isShortShow: false,
            percent: 0,
            textereaValue: ""
        };
    }

    textChangeHandle = (e) => {
        this.setState({
            textereaValue: e.target.value.substr(0, 512)
        });
        this.props.statusHandle(1);
    }
    blurHandle = () => {
        let that = this;
        this.props.statusHandle(2);

        setTimeout(function(){
            that.setState({
                isShortShow: false
            });
        }, 500);

    }
    textFocusHandle = () => {
        this.setState({
            isEmojiShow: false
        });
    }

    sendMessage = (e) => {
        e.preventDefault();
        let msgVal = e.target.value,
            msg = msgVal.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /gi, '&nbsp;').replace(/\n/gi, '#');

        if(msgVal.length > 0 && !this.state.isShortShow){
            this.props.sendMessage(cutStr(msg, 256));
            this.setState({
                isEmojiShow: false,
                textereaValue: "",
                isSendReady: true
            });
        }

    }
    onKeyDown = (e) => {
        if(e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9){
            e.preventDefault();
        }
    }

    onKeyup = (e) => {

        let tg = e.target,
            val = tg.value,
            keyCode = e.keyCode,
            sIndex = tg.selectionStart,
            cmd = val.substr(sIndex - 2, 2);

        if(keyCode === 38 && this.state.isShortShow){
            shortListIndex--;
            this.shortCutsSelector(-1);
        }
        if(keyCode === 40 && this.state.isShortShow){
            shortListIndex++;
            this.shortCutsSelector(1);
        }

        if(/(\s;)|(^;$)/.test(cmd)){
            this.setState({
                isShortShow: true
            });
        }else{
            this.setState({
                isShortShow: false
            });
        }

        if(keyCode === 9 || keyCode === 13){
            if(document.querySelector('.short-list .on')){
                this.insertToCursorPosition(val.replace(new RegExp(cmd, 'g'), ' '), ' '+document.querySelector('.short-list .on .key-value').innerHTML+' ');
            }
            this.setState({
                isShortShow: false
            });
        }
    }

    shortCutSelecterClick = (val) => {
        this.insertToCursorPosition(this.state.textereaValue.replace(/(\s;)|(^;)/g, ''), ' '+val);
    }

    shortCutsSelector = (direction) => {
        if(document.querySelector('.shortListUl li')){
            let h = document.querySelector('.short-list li').offsetHeight,
                list = document.querySelectorAll('.short-list li'),
                len = list.length,
                shortList = document.querySelector('.short-list');

            if(direction === 1){
                if(shortListIndex*h >= shortList.offsetHeight){
                    shortList.scrollTop += direction*h;
                }
                if(shortListIndex*h >= shortList.scrollHeight){
                    shortList.scrollTop = 0;
                    shortListIndex = 0;
                }
            }else{
                if(shortListIndex < 0){
                    shortListIndex = len - 1;
                    shortList.scrollTop = shortListIndex * h;
                }
                if((shortListIndex + 1) *h <= shortList.scrollTop){
                    shortList.scrollTop += direction*h;
                }
            }

            for(let i = 0; i < len; i++){
                list[i].className = list[i].className.replace(/\son/g, '');
            }
            document.querySelector('.s-'+shortListIndex) && (document.querySelector('.s-'+shortListIndex).className += ' on');
        }
    }

    emojiBtnHandle = () => {
        this.setState({
            isEmojiShow: !this.state.isEmojiShow
        })
    }

    addEmojiHandle = (emoji) => {
        this.insertToCursorPosition(this.state.textereaValue, emoji);
    }

    insertToCursorPosition = (s1, s2) => {
        let obj = document.getElementsByClassName("chat-textarea")[0];
        obj.focus();

        if(document.selection) {
            let sel = document.selection.createRange();
            sel.text = s2;
        }else if(typeof obj.selectionStart === 'number' && typeof obj.selectionEnd === 'number') {
            let startPos = obj.selectionStart,
                endPos = obj.selectionEnd,
                cursorPos = startPos,
                tmpStr = s1,
                s3 = tmpStr.substring(0, startPos) + s2 + tmpStr.substring(endPos, tmpStr.length);

            this.setState({
                textereaValue: s3
            });
            cursorPos += s2.length;
            obj.selectionStart = obj.selectionEnd = cursorPos;
        }else{
             this.setState({
                textereaValue: this.state.textereaValue+ s2 +" "
             });
        }
    }
    rateHandle = (e) => {
        let {socket, cid} = this.props;
        Modal.confirm({
            title: 'Invite user rate',
            okText: 'Yes',
            cancelText: 'Cancel',
            content: (
                <p>Are you sure invite the user rate?</p>
            ),
            onOk(){
                message.success('Invitation has been sent!', 4);
                socket && socket.emit('cs.rate', cid, function(success){});
            }
        });
    }

    beforeUpload = (file) => {
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        }
        return isLt2M;
    }

    render(){
        let {sendMessage, cid, csid} = this.props,
            {percent, isShowProcess, isEmojiShow, isSendReady, textereaValue, isShortShow} = this.state,
            _self = this,
            props = {
                name: 'image',
                action: '/messages/customer/'+cid+'/cs/'+csid+'/image',
                accept: 'image/*',
                headers: {
                    authorization: 'authorization-text',
                },
                beforeUpload: _self.beforeUpload,
                onChange(info) {
                    let status = info.file.status;

                    if(status === 'uploading'){
                        if(info.event){
                            _self.setState({
                                isShowProcess: true,
                                percent: Math.ceil(info.event.percent)
                            });
                        }
                    }else if(status === 'done') {
                        if(200 === info.file.response.code){
                            sendMessage(info.file.response.msg.resized+'|'+info.file.response.msg.original+'|'+info.file.response.msg.w+'|'+info.file.response.msg.h);
                        }
                        message.success(info.file.name+' file uploaded successfully', 2, function(){
                            _self.setState({
                                isShowProcess: false
                            });
                        });
                    }else if(status === 'error') {
                        message.error(info.file.name+' file upload failed.', 2, function(){
                            _self.setState({
                                isShowProcess: false
                            });
                        });
                    }
                }
            };

        return (
            <div className="chat-send">
                <Progress type="circle" percent={percent} className="upload-process" width={60} style={{display: isShowProcess ? 'block' : 'none'}} />
                <div className="send-tools">
                    <div className="tool-box tool-emoji">
                        <Icon onClick={this.emojiBtnHandle} className={"emoji-icon "+(isEmojiShow ? 'active' : '')} />
                        {
                            isEmojiShow &&  <EmojiPicker addEmojiHandle={this.addEmojiHandle} />
                        }
                    </div>
                    <div className="tool-box">
                        <Upload {...props}>
                            <Icon type="folder" className="upload-icon" />
                        </Upload>
                    </div>
                    <div className="tool-box">
                        <span className="rate-icon" title="Invite user evaluation" onClick={this.rateHandle}></span>
                    </div>
                </div>
                <div className="chat-text">
                {isShortShow && <ChatShortcut shortCutSelecterClick={this.shortCutSelecterClick} csid={csid} isShow={isShortShow}  />}
                <Input
                    type="textarea"
                    className="chat-textarea"
                    onPressEnter={this.sendMessage}
                    placeholder={isSendReady ? "" : "Enter message.Type ;to bring up shortcuts."}
                    onChange={this.textChangeHandle}
                    onKeyUp={this.onKeyup}
                    onKeyDown={this.onKeyDown}
                    value={textereaValue}
                    onFocus={this.textFocusHandle}
                    onBlur={this.blurHandle}
                    maxLength="256"
                    />
                </div>
            </div>
        );
    }
}

export default ChatSend;