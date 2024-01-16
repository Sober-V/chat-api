import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {API, copy, isAdmin, showError, showSuccess, showWarning, timestamp2string} from '../helpers';

import {ITEMS_PER_PAGE} from '../constants';
import {renderQuota, stringToColor,renderGroup} from '../helpers/render';
import {
    Avatar,
    Tag,
    Table,
    Button,
    Popover,
    Form,
    Modal,
    Popconfirm,
    SplitButtonGroup,
    Dropdown,
    Select,Switch,Tooltip
} from "@douyinfe/semi-ui";

import {
    IconTreeTriangleDown,IconEyeOpened
} from '@douyinfe/semi-icons';
import EditToken from "../pages/Token/EditToken";


function renderTimestamp(timestamp) {
    return (
        <>
            {timestamp2string(timestamp)}
        </>
    );
}

function renderStatus(status, record, manageToken) {
    const isOn = status === 1; // 开启状态
    const isOffOrClosed = [2, 3, 4].includes(status); // 关闭或已关闭状态
    let statusText = '';

    switch (status) {
        case 1:
            statusText = '已启用';
            break;
        case 2:
            statusText = '已禁用';
            break;
        case 3:
            statusText = '已过期';
            break;
        case 4:
            statusText = '已耗尽';
            break;
        default:
            statusText = '未知状态';
    }

    return (
        <Tooltip content={statusText} position="top">
            <Switch
                checked={isOn}
                checkedText="开"
                uncheckedText={["3", "4"].includes(status) ? "〇" : "关"}
                onChange={(checked) => {
                    if (checked) {
                        manageToken(record.id, 'enable', record); // 启用令牌
                    } else if (!checked && isOn) {
                        manageToken(record.id, 'disable', record); // 禁用令牌
                    }
                }}
            />
        </Tooltip>
    );
}

const TokensTable = () => {
    const isAdminUser = isAdmin();
    const [modelRatioEnabled, setModelRatioEnabled] = useState('');
    const [billingByRequestEnabled, setBillingByRequestEnabled] = useState('');

    const link_menu = [
        {node: 'item', key: 'next', name: 'ChatGPT Next Web', onClick: () => {onOpenLink('next')}},
        {node: 'item', key: 'ama', name: 'AMA 问天', value: 'ama'},
        {node: 'item', key: 'opencat', name: 'OpenCat', value: 'opencat'},
    ];

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            render: (text, record, dataIndex) => {
                return (
                    
                        <div>
                            <Tag onClick={async () => {
                                await copyText(text);
                            }}>
                                {text}
                            </Tag>
                        </div>
                     
                );
            },
        },        
        isAdminUser && {
            title: '分组',
            dataIndex: 'group',
            key: 'group',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderGroup(text)}
                    </div>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (text, record, index) => {
                return renderStatus(text, record, manageToken);
            },
        },
        
        {
            title: '已用额度',
            dataIndex: 'used_quota',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderQuota(parseInt(text))}
                    </div>
                );
            },
        },
        {
            title: '剩余额度',
            dataIndex: 'remain_quota',
            render: (text, record, index) => {
                return (
                    <div>
                        {record.unlimited_quota ? <Tag size={'large'} color={'white'}>无限制</Tag> : <Tag size={'large'} color={'light-blue'}>{renderQuota(parseInt(text))}</Tag>}
                    </div>
                );
            },
        },
        {
            title: '创建时间',
            dataIndex: 'created_time',
            render: (text, record, index) => {
                return (
                    <div>
                        {renderTimestamp(text)}
                    </div>
                );
            },
        },
        {
            title: '过期时间',
            dataIndex: 'expired_time',
            render: (text, record, index) => {
                return (
                    <div>
                        {record.expired_time === -1 ? "永不过期" : renderTimestamp(text)}
                    </div>
                );
            },
        },
        modelRatioEnabled && billingByRequestEnabled && {
            title: '计费策略',
            dataIndex: 'billing_enabled',
            render: (text, record, index) => {
                const defaultValue = text ? "1" : "0";
        
                return (
                    <Select defaultValue={defaultValue} style={{ width: 120 }}
                            onChange={(value) => updateTokenBillingStrategy(value === "1", record.id)}>
                        <Select.Option value="0">按Token计费</Select.Option>
                        <Select.Option value="1">按次计费</Select.Option>
                    </Select>
                );
            },
        },                                         
        {
            title: '',
            dataIndex: 'operate',
            render: (text, record, index) => (
                <div>
                    <Popover
                        content={'sk-' + record.key}
                        style={{ padding: 20 }}
                        position="top"
                    >
                        <Button theme='light' type='tertiary' icon={<IconEyeOpened />} style={{ marginRight: 1 }} />
                    </Popover>

                    <Button theme='light' type='secondary' style={{marginRight: 1}}
                            onClick={async (text) => {
                                await copyText('sk-' + record.key)
                            }}
                    >复制</Button>
                    {/* <SplitButtonGroup style={{marginRight: 1}} aria-label="项目操作按钮组">
                        <Button theme="light" style={{ color: 'rgba(var(--semi-teal-7), 1)' }} onClick={()=>{onOpenLink('next', record.key)}}>聊天</Button>
                        {/*<Dropdown trigger="click" position="bottomRight" menu={
                            [
                                {node: 'item', key: 'next', name: 'ChatGPT Next Web', onClick: () => {onOpenLink('next', record.key)}},
                                {node: 'item', key: 'ama', name: 'AMA 问天（BotGrem）', onClick: () => {onOpenLink('ama', record.key)}},
                                {node: 'item', key: 'opencat', name: 'OpenCat', onClick: () => {onOpenLink('opencat', record.key)}},
                            ]
                        }
                        >
                            <Button style={ { padding: '8px 4px', color: 'rgba(var(--semi-teal-7), 1)' }} type="primary" icon={<IconTreeTriangleDown />}></Button>
                    </Dropdown>
                    </SplitButtonGroup>*/}
                    <Popconfirm
                        title="确定是否要删除此令牌？"
                        content="此修改将不可逆"
                        okType={'danger'}
                        position={'left'}
                        onConfirm={() => {
                            manageToken(record.id, 'delete', record).then(
                                () => {
                                    removeRecord(record.key);
                                }
                            )
                        }}
                    >
                        <Button theme='light' type='danger' style={{marginRight: 1}}>删除</Button>
                    </Popconfirm>
                    {/*{
                        record.status === 1 ?
                            <Button theme='light' type='warning' style={{marginRight: 1}} onClick={
                                async () => {
                                    manageToken(
                                        record.id,
                                        'disable',
                                        record
                                    )
                                }
                            }>禁用</Button> :
                            <Button theme='light' type='secondary' style={{marginRight: 1}} onClick={
                                async () => {
                                    manageToken(
                                        record.id,
                                        'enable',
                                        record
                                    );
                                }
                            }>启用</Button>
                    }*/}
                    
                    <Button theme='light' type='tertiary' style={{marginRight: 1}} onClick={
                        () => {
                            setEditingToken(record);
                            setShowEdit(true);
                        }
                    }>编辑</Button>
                </div>
            ),
        },
    ].filter(Boolean);
    

    const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
    const [showEdit, setShowEdit] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [tokenCount, setTokenCount] = useState(pageSize);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(1);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchToken, setSearchToken] = useState('');
    const [searching, setSearching] = useState(false);
    
    const [editingToken, setEditingToken] = useState({
        id: undefined,
    });

    const [options, setOptions] = useState({});

    const closeEdit = () => {
        setShowEdit(false);
    }

    const setTokensFormat = (tokens) => {
        setTokens(tokens);
        if (tokens.length >= pageSize) {
            setTokenCount(tokens.length + pageSize);
        } else {
            setTokenCount(tokens.length);
        }
    }


    let pageData = tokens.slice((activePage - 1) * pageSize, activePage * pageSize);
    const loadTokens = async (startIdx) => {
        setLoading(true);
        const res = await API.get(`/api/token/?p=${startIdx}&size=${pageSize}`);
        const {success, message, data} = res.data;
        if (success) {
            if (startIdx === 0) {
                setTokensFormat(data);
            } else {
                let newTokens = [...tokens];
                newTokens.splice(startIdx * pageSize, data.length, ...data);
                setTokensFormat(newTokens);
            }
        } else {
            showError(message);
        }
        setLoading(false);
    };



    const refresh = async () => {
        await loadTokens(activePage - 1);
    };


    const copyText = async (text) => {
        if (await copy(text)) {
            showSuccess('已复制到剪贴板！');
        } else {
            // setSearchKeyword(text);
            Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
        }
    }

    const onOpenLink = async (type, key) => {
        let status = localStorage.getItem('status');
        let serverAddress = '';
        if (status) {
            status = JSON.parse(status);
            serverAddress = status.server_address;
        }
        if (serverAddress === '') {
            serverAddress = window.location.origin;
        }
        let encodedServerAddress = encodeURIComponent(serverAddress);
        const chatLink = localStorage.getItem('chat_link');
        let defaultUrl;

        if (chatLink) {
            defaultUrl = chatLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        } else {
            showError('管理员未设置聊天链接')
            return
        }
        let url;
        switch (type) {
            case 'ama':
                url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
                break;

            case 'opencat':
                url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
                break;

            default:
                url = defaultUrl;
        }

        window.open(url, '_blank');
    }

    useEffect(() => {
        loadTokens(0)
            .then()
            .catch((reason) => {
                showError(reason);
            });
        getOptions();
    }, [pageSize]);

    const getOptions = async () => {
        const res = await API.get('/api/user/option');
        const { success, message, data } = res.data;
        if (success) {
          let newOptions = {};
          data.forEach((item) => {
            newOptions[item.key] = item.value;
          });
          setOptions(newOptions); // 设置所有选项的状态
        } else {
          showError(message);
        }
      };
    
      useEffect(() => {
        if (options.ModelRatioEnabled) { 
          setModelRatioEnabled(options.ModelRatioEnabled === 'true');
        }
        if (options.BillingByRequestEnabled) { 
          setBillingByRequestEnabled(options.BillingByRequestEnabled === 'true');
        }
      }, [options]);

    const removeRecord = key => {
        let newDataSource = [...tokens];
        if (key != null) {
            let idx = newDataSource.findIndex(data => data.key === key);

            if (idx > -1) {
                newDataSource.splice(idx, 1);
                setTokensFormat(newDataSource);
            }
        }
    };

    // 更新令牌的收费策略
    const updateTokenBillingStrategy = async (billingEnabled, id) => {
        setLoading(true);
        try {
          const res = await API.put(`/api/token/${id}/billing_strategy`, {
            billing_enabled: billingEnabled ? 1 : 0, 
          });
      
          // 确保响应存在并且有data属性
          if (res && res.data) {
            if (res.data.success) {
              showSuccess('计费策略已更新');
              refresh(); // 重新加载数据以反映更改
            } else {
              showError(res.data.message);
            }
          } else {
            // 如果没有data属性，抛出错误，走到catch块
            throw new Error('Invalid response structure');
          }
        } catch (error) {
          showError(`更新失败: ${error.message ?? error.toString()}`);
        } finally {
          setLoading(false);
        }
    };
      
    const manageToken = async (id, action, record) => {
        setLoading(true);
        let data = {id};
        let res;
        // eslint-disable-next-line default-case
        switch (action) {
            case 'delete':
                res = await API.delete(`/api/token/${id}/`);
                break;
            case 'enable':
                data.status = 1;
                res = await API.put('/api/token/?status_only=true', data);
                break;
            case 'disable':
                data.status = 2;
                res = await API.put('/api/token/?status_only=true', data);
                break;
        }
        const {success, message} = res.data;
        if (success) {
            showSuccess('操作成功完成！');
            let token = res.data.data;
            let newTokens = [...tokens];
            // let realIdx = (activePage - 1) * ITEMS_PER_PAGE + idx;
            if (action === 'delete') {

            } else {
                record.status = token.status;
                // newTokens[realIdx].status = token.status;
            }
            setTokensFormat(newTokens);
        } else {
            showError(message);
        }
        setLoading(false);
    };

    const searchTokens = async () => {
        if (searchKeyword === '' && searchToken === '') {
            // if keyword is blank, load files instead.
            await loadTokens(0);
            setActivePage(1);
            return;
        }
        setSearching(true);
        const res = await API.get(`/api/token/search?keyword=${searchKeyword}&token=${searchToken}`);
        const {success, message, data} = res.data;
        if (success) {
            setTokensFormat(data);
            setActivePage(1);
        } else {
            showError(message);
        }
        setSearching(false);
    };

    const handleKeywordChange = async (value) => {
        setSearchKeyword(value.trim());
    };

    const handleSearchTokenChange = async (value) => {
        setSearchToken(value.trim());
    };

    const sortToken = (key) => {
        if (tokens.length === 0) return;
        setLoading(true);
        let sortedTokens = [...tokens];
        sortedTokens.sort((a, b) => {
            return ('' + a[key]).localeCompare(b[key]);
        });
        if (sortedTokens[0].id === tokens[0].id) {
            sortedTokens.reverse();
        }
        setTokens(sortedTokens);
        setLoading(false);
    };


    const handlePageChange = page => {
        setActivePage(page);
        if (page === Math.ceil(tokens.length / pageSize) + 1) {
            // In this case we have to load more data and then append them.
            loadTokens(page - 1).then(r => {
            });
        }
    };

    // 新增一个函数用于删除所选token
    const deleteSelectedTokens = async () => {
        if (selectedKeys.length === 0) {
        showError('请至少选择一个令牌！');
        return;
        }

        setLoading(true);
        try {
        // 这里注释掉了原有代码是为了集中展示删除逻辑
        // let newTokens = [...tokens];

        // 使用Promise.all同时开始所有删除请求
        await Promise.all(selectedKeys.map(async (record) => {
            await API.delete(`/api/token/${record.id}/`);
        }));

        // 过滤掉已被删除的token
        let remainingTokens = tokens.filter(token => !selectedKeys.includes(token));
        setTokens(remainingTokens);
        setSelectedKeys([]); // 清空选择
        showSuccess('所选令牌已成功删除。');
        } catch (error) {
        showError('删除失败: ' + error.message);
        }
        setLoading(false);
    };


    const rowSelection = {
        onSelect: (record, selected) => {
        },
        onSelectAll: (selected, selectedRows) => {
        },
        onChange: (selectedRowKeys, selectedRows) => {
            setSelectedKeys(selectedRows);
        },
    };

    const handleRow = (record, index) => {
        if (record.status !== 1) {
            return {
                style: {
                    background: 'var(--semi-color-disabled-border)',
                },
            };
        } else {
            return {};
        }
    };

    return (
        <>
            <EditToken refresh={refresh} editingToken={editingToken} visiable={showEdit} handleClose={closeEdit}></EditToken>
            <Form layout='horizontal' style={{marginTop: 10}} labelPosition={'left'}>
                <Form.Input
                    field="keyword"
                    label='搜索关键字'
                    placeholder='令牌名称'
                    value={searchKeyword}
                    loading={searching}
                    onChange={handleKeywordChange}
                />
                <Form.Input
                    field="token"
                    label='Key'
                    placeholder='密钥'
                    value={searchToken}
                    loading={searching}
                    onChange={handleSearchTokenChange}
                />
                <Button label='查询' type="primary" htmlType="submit" className="btn-margin-right"
                        onClick={searchTokens} style={{marginRight: 8}}>查询</Button>
            </Form>

            <Table style={{marginTop: 20}} columns={columns} dataSource={pageData} pagination={{
                currentPage: activePage,
                pageSize: pageSize,
                total: tokenCount,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                formatPageText: (page) => `第 ${page.currentStart} - ${page.currentEnd} 条，共 ${tokens.length} 条`,
                onPageSizeChange: (size) => {
                    setPageSize(size);
                    setActivePage(1);
                },
                onPageChange: handlePageChange,
            }} loading={loading} rowSelection={rowSelection} onRow={handleRow}>
            </Table>
            <Button theme='light' type='primary' style={{marginRight: 8}} onClick={
                () => {
                    setEditingToken({
                        id: undefined,
                    });
                    setShowEdit(true);
                }
            }>添加令牌</Button>
            <Button label='复制所选令牌' type="warning" onClick={
                async () => {
                    if (selectedKeys.length === 0) {
                        showError('请至少选择一个令牌！');
                        return;
                    }
                    let keys = "";
                    for (let i = 0; i < selectedKeys.length; i++) {
                        keys += selectedKeys[i].name + "    sk-" + selectedKeys[i].key + "\n";
                    }
                    await copyText(keys);
                }
            }>复制所选令牌到剪贴板</Button>
            {/* 新增删除按钮 */}
            <Popconfirm
                title="确定是否要删除所选令牌"
                content="此修改将不可逆"
                okType={'danger'}
                onConfirm={deleteSelectedTokens}
            >
                <Button theme='light' type='danger' style={{ marginLeft: '8px' }}>删除所选令牌</Button>
            </Popconfirm>        
        </>
    );
};

export default TokensTable;
