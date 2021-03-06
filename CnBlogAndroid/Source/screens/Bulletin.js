import Config from '../config';
import api from '../api/api.js';
import {authData} from '../config'
import * as Service from '../request/request.js'
import MyAdapter from './MyAdapter.js';
import React, { Component} from 'react';
import {UI} from '../config'
import {err_info} from '../config'
import {flatStyles} from '../styles/styles'
import ListSeperator from '../component/ListSeperator'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableHighlight,
    ActivityIndicator,
    TouchableOpacity,
    ToastAndroid,
    screen,
    Alert,
} from 'react-native';
import { Separator } from 'native-base';

const HTMLSpecialCharsDecode = require('../DataHandler/HTMLSpecialCharsDecode');
const relativeTime = require('../DataHandler/DateHandler');

const screenWidth= MyAdapter.screenWidth;
const screenHeight= MyAdapter.screenHeight;
const titleFontSize= MyAdapter.titleFontSize;
const abstractFontSize= MyAdapter.abstractFontSize;
const informationFontSize= MyAdapter.informationFontSize;
const btnFontSize= MyAdapter.btnFontSize;
const pageSize = 10;

const HtmlDecode = require('../DataHandler/HomeworkDetails/HtmlDecode');

export default class Bulletin extends Component {
    constructor(props){
        super(props);
        this.state = {
            changedSchoolClassId: this.props.changedSchoolClassId,
            bulletins: [],
            bulletinCount: 0,
            membership: 1,
            loadStatus: 'not loading',
            currentPageIndex: 1,
        }
        this._isMounted=true;
    }
    _isMounted;

    // componentWillUpdate(){
    //     this._isMounted=true;
    //     this.fetchPage(this.state.currentPageIndex);
    // }

    /* 弹出选择框询问是否删除 */
    _onPressDelBulletin(content, id) {
        if(!this._isMounted){
            return;
        }
        if(this.state.membership===1) {
            this.props.navigation.navigate('BulletinDisplay',{
                schoolClassId: this.props.schoolClassId,
                className:this.props.className,
                bulletinText: content,
                bulletinId: id,
                membership: this.state.membership,
                callback: this._FlatListRefresh
            });
        }
        else if (this.state.membership===2 || this.state.membership===3) {
            Alert.alert(
                '删除公告',
                '确定要删除吗？',
                [
                    {text: '取消'},
                    {text: '确认删除', onPress: ()=>{
                        const postBody = {
                            bulletinId: id,
                            schoolClassId: this.props.schoolClassId,
                            blogId: global.user_information.BlogId,
                        };
                        const body = JSON.stringify(postBody);
                        const url = Config.BulletinDel + this.props.schoolClassId + '/' + id;

                        Service.UserAction(url, body, 'DELETE').then((response)=>{
                            if(response.status!==200)
                            {
                                return null;
                            }
                            else{
                                return response.json();
                            }
                        }).then((jsonData)=>{
                            if(jsonData===null)
                            {
                                ToastAndroid.show('请求失败！您可能不是该班级的教师或助教，无此权限！',ToastAndroid.SHORT);
                            }
                            else if(jsonData.isSuccess)
                            {
                                ToastAndroid.show('删除成功！',ToastAndroid.SHORT);
                                this.fetchPage(1);
                            }
                            else if(jsonData.isWarning)
                            {
                                ToastAndroid.show(jsonData.message,ToastAndroid.SHORT);
                            }
                            else
                            {
                                ToastAndroid.show('发生错误，请稍后重试！',ToastAndroid.SHORT);
                            }
                        }).catch((error) => {
                            ToastAndroid.show(err_info.NO_INTERNET ,ToastAndroid.SHORT);
                        });
                    }},
                ]
            );
        }
    }

    /* 渲染一个公告数据 */
    _renderItem = (item) => {
        const item1 = item;
        const Id = item1.item.key;
        const Content = item1.item.Content;
        const Publisher = item1.item.Publisher;
        const BlogUrl = item1.item.BlogUrl;
        const DateAdded = item1.item.DateAdded;
        return(
            <TouchableOpacity onPress={()=>{
                this.props.navigation.navigate('BulletinDisplay',{
                    schoolClassId: this.props.schoolClassId,
                    bulletinId: Id,
                    bulletinText: Content,
                    className:this.props.className,
                    membership: this.state.membership,
                    callback: this._FlatListRefresh
                });
            } } onLongPress={()=>{this._onPressDelBulletin(Content, Id);}}
                style={[flatStyles.cellWithBorder, {backgroundColor: global.theme.backgroundColor, height: 100, borderColor: global.theme.cellBorderColor}]}
            >
                <View style={[styles.textcontainer, {backgroundColor: global.theme.backgroundColor}]}>
                    <Text numberOfLines={3} style={[styles.bulletinContent, {color: global.theme.textColor}]}>
                        {Content}
                    </Text>
                    <View style={{alignSelf: 'flex-end'}}>
                        <Text style={[styles.bulletinDateAdded, {color: global.theme.grayTextColor}]}>
                            {Publisher + ' · ' + DateAdded}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    };

    /* 刷新公告页面的函数，在改变班级、修改和发布公告后都应调用 */
    _FlatListRefresh = ()=>{
        if (this._isMounted){
            this.fetchPage(1);
        }
    };

    /* 渲染公告列表 */
    _renderBulletinList() {
        let data = [];
        for(let i in this.state.bulletins)
        {
        data.push({
            key: this.state.bulletins[i].bulletinId,
            Content: HtmlDecode(this.state.bulletins[i].content),
            Publisher: this.state.bulletins[i].publisher,
            BlogUrl: this.state.bulletins[i].blogUrl,
            DateAdded: relativeTime(this.state.bulletins[i].dateAdded),
        })
        }
        return(
            <View style={{width: screenWidth, backgroundColor: global.theme.backgroundColor}}>
            {
                this.state.loadStatus==='none'?
                    (
                        <View style={{height:30,alignItems:'center',justifyContent:'flex-start',}}>
                            <Text style={{color:global.theme.promptTextColor,fontSize:14,marginTop:5,marginBottom:5,}}>
                            这还什么都没有
                            </Text>
                        </View>
                    ): ( null )
            }
                <FlatList
                    renderItem={this._renderItem}
                    data= {data}
                    refreshing= {false}
                    onRefresh = {this._FlatListRefresh}
                    ListFooterComponent={this._renderFooter.bind(this)}
                    onEndReached={this._onEndReached.bind(this)}
                    onEndReachedThreshold={0.1}
                />
            </View>
        )
    }

    /* 公告列表到达底部时，渲染底部文本 */
    _renderFooter(){
        if (this.state.loadStatus === 'all loaded') {
            return (
                <View style={{height:30,alignItems:'center',justifyContent:'flex-start',}}>
                    <Text style={{color:global.theme.promptTextColor,fontSize:14,marginTop:5,marginBottom:5,}}>
                    再往下拉也没有了呢 ~
                    </Text>
                </View>
            );
        } else if(this.state.loadStatus === 'loading') {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator />
                    <Text style={{color:global.theme.promptTextColor,}}>正在加载更多数据...</Text>
                </View>
            );
        } //else 'not loading'
        return (
            <View style={styles.footer}>
                <Text></Text>
            </View>
        );
    }

    _onEndReached() {
        if (this.state.loadStatus != 'not loading') {
			return;
		}
		const pageCount = Math.ceil(this.state.bulletinCount / pageSize);
		if (this.state.currentPageIndex >= pageCount) {
			return;
		}
        this.state.currentPageIndex++;
		this.fetchPage(this.state.currentPageIndex);
    }

    /* 获取某页面的数据，这里简单的考虑第一页时重置公告列表，其他情况追加数据 */
    fetchPage(pageIndex) {
        if (!this._isMounted)
        {
            return ;
        }
        //console.log('fetchPage func: ', pageIndex);
        let membership = 1;
        /* 这里先获取用户在班级中的身份 */
        const url1 = Config.apiDomain + api.user.info;
        Service.Get(url1).then((jsonData)=>{
            const url2= Config.apiDomain+"api/edu/member/"+jsonData.BlogId+"/"+this.props.schoolClassId;
            Service.Get(url2).then((jsonData)=>{
                if(this._isMounted && jsonData!=='rejected'){
                    membership = jsonData.membership;
                }
            }).then(()=>{
                const url = Config.BulletinList + this.props.schoolClassId + '/'+ pageIndex + '-'+ pageSize;
                Service.Get(url).then((jsonData)=>{
                    const pageCount = Math.ceil(jsonData.totalCount / pageSize);
                    if(jsonData!=='rejected')
                    {
                        if(pageIndex===1)
                        {
                            this.setState({
                                bulletinCount: jsonData.totalCount,
                                bulletins: jsonData.bulletins,
                                loadStatus: pageCount<=1 ? 'all loaded' : 'not loading',
                                changedSchoolClassId: false,
                                membership: membership,
                                currentPageIndex: 1,
                            });
                        }
                        else
                        {
                            this.setState({
                                bulletinCount: jsonData.totalCount,
                                bulletins: this.state.bulletins.concat(jsonData.bulletins),
                                loadStatus: this.state.currentPageIndex>=pageCount ? 'all loaded' : 'not loading',
                                changedSchoolClassId: false,
                                membership: membership,
                            });
                        }
                    }
                    else
                    {
                        if(pageIndex==1)
                        {
                            this.setState({
                                loadStatus: 'none',
                                bulletinCount: 0,
                                bulletins: [],
                                currentPageIndex: 1,
                            });
                        }

                    }
                }).then(()=>{;
                }).catch((error) => {
                    ToastAndroid.show(err_info.TIME_OUT,ToastAndroid.SHORT);
                });
            }).catch((err)=>{
                ToastAndroid.show(err_info.TIME_OUT,ToastAndroid.SHORT);
                this.setState({
                    changedSchoolClassId: true,
                    membership: membership,
                    bulletins: [],
                    bulletinCount: 0,
                    loadStatus: 'not loading',
                    currentPageIndex: 1,
                });
            });
        }).catch((err)=>{
            ToastAndroid.show(err_info.TIME_OUT,ToastAndroid.SHORT);
            this.setState({
                changedSchoolClassId: true,
                membership: membership,
                bulletins: [],
                bulletinCount: 0,
                loadStatus: 'not loading',
                currentPageIndex: 1,
            });
        });


    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    /* 单击添加公告列表时的响应函数 */
    _onPress = ()=>{
        if (this.state.membership==2||this.state.membership==3) {
            this.props.navigation.navigate('BulletinEdit', {
                createNew: true,
                schoolClassId: this.props.schoolClassId,
                className: this.props.className,
                callback: this._FlatListRefresh,
            })
        }
        else
        {
            ToastAndroid.show("您没有权限，只有老师和助教才能发布公告哦！",ToastAndroid.SHORT);
        }
    }

    /* 修改prop属性时调用 */
    componentWillReceiveProps(nextProps) {
        if (!this._isMounted)
        {
            return ;
        }
        this.setState({
            membership: 0,
            bulletins: [],
            bulletinCount: 0,
        });
        /* 当传入的参数改变时首先获取用户在班级中的身份  */
        let membership = 1;
        const url1 = Config.apiDomain + api.user.info;
        Service.Get(url1).then((jsonData)=>{
            const url2= Config.apiDomain+"api/edu/member/"+jsonData.BlogId+"/"+this.props.schoolClassId;
            Service.Get(url2).then((jsonData)=>{
                if(this._isMounted && jsonData!=='rejected'){
                    membership = jsonData.membership;
                }
            }).then(()=>{
                    this.setState({
                        changedSchoolClassId: true,
                        membership: membership,
                        bulletins: [],
                        bulletinCount: 0,
                        loadStatus: 'not loading',
                        currentPageIndex: 1,
                    });
                }
            ).catch((err)=>{
                ToastAndroid.show(err_info.TIME_OUT,ToastAndroid.SHORT);
                this.setState({
                    changedSchoolClassId: true,
                    membership: membership,
                    bulletins: [],
                    bulletinCount: 0,
                    loadStatus: 'not loading',
                    currentPageIndex: 1,
                });
            });
        }).catch((err)=>{
            ToastAndroid.show(err_info.TIME_OUT,ToastAndroid.SHORT);
            this.setState({
                changedSchoolClassId: true,
                membership: membership,
                bulletins: [],
                bulletinCount: 0,
                loadStatus: 'not loading',
                currentPageIndex: 1,
            });
        });
    }

    /* 将网站返回的时间字符串改成预期 */
    String2Date = (day)=>{
        if(day == null)
            return '  ';
        let s1 = day.split('T')[0];
        let s2 = day.split('T')[1];
        return s1 + '  ' + s2.split('.')[0];
    }

    render() {
        if(this.state.changedSchoolClassId === true){
            this.fetchPage(1);
        }
        return (
            <View style = {[styles.container, {backgroundColor: global.theme.backgroundColor}]}>
                <View>
                    {
                        this._renderBulletinList()
                    }
                    <View
                        style= {{
                            flexDirection: 'row',
                            justifyContent:'flex-start',
                            alignItems: 'flex-start',
                            alignSelf: 'stretch',
                            flex:1,
                        }}
                    >
                    {
                        (this.state.membership==2||this.state.membership==3)?
                        (
                            <TouchableHighlight
                                underlayColor={global.theme.addUnderlaydColor}
                                activeOpacity={0.5}
                                style={{
                                    position:'absolute',
                                    bottom:20,
                                    right:10,
                                    backgroundColor: global.theme.addBackgroundColor,
                                    width: 52,
                                    height: 52,
                                    borderRadius: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    margin: 20}}
                                    onPress={this._onPress} >

                                <Text
                                    style= {{
                                        fontSize: 30,
                                        color: global.theme.addTextColor,
                                        textAlign: 'center',
                                        fontWeight: '100',
                                    }}
                                >
                                    +
                                </Text>

                            </TouchableHighlight>
                        ):
                        (
                            null
                        )
                    }
                    </View>
                </View>


            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    textcontainer: {
        justifyContent:'flex-start',
        alignItems: 'flex-start',
        flex: 4,
        backgroundColor: 'white',
        paddingTop: 3,
    },
    bulletinContent: {
        flex: 1,
        color: 'black',
        fontSize: 16,
        left: 4,
    },
    bulletinDateAdded: {
        fontSize: 10,
    },
    bulletinPublisher: {
        fontSize: 10,
    },
});

/*
分页获取班级公告列表
请求方式：GET
请求地址：https://api.cnblogs.com/api/edu/schoolclass/bulletins/{schoolClassId}/{pageIndex}-{pageSize}


Body参数名	类型	必需	描述	示例 e.g.
schoolClassId	number	是	班级Id	1
pageIndex	number	是	页码	1
pageSize	number	是	页容量	10


Body参数名	描述	类型
totalCount	            公告总数	number
bulletins               公告列表	array
bulletins.bulletinId	公告Id	number
bulletins.content       内容	string
bulletins.publisher	    发布者	string
bulletins.blogUrl       发布者博客	string
bulletins.dateAdded	    发布时间	datetime
*/
