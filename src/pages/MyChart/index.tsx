import {listMyChartByPageUsingPost} from '@/services/backend/chartController';
import {useModel} from '@@/exports';
import React, {useEffect, useState} from 'react';
import {Avatar, Card, Divider, List, message, Result} from "antd";
import Search from "antd/es/input/Search";
import {ChartStatusEnum} from "@/enums/chartStatusEnum";
import {format} from "date-fns";
import ReactECharts from "echarts-for-react";

/**
 * 添加图表页面
 * @constructor
 */
// 把多余的状态删掉，页面名称改为AddChart
const MyChart: React.FC = () => {
  const initSearchParams = {
    current: 1,
    pageSize: 4,
    sortField: 'createTime',
    sortOrder: 'desc',
  };

  const [searchParams, setSearchParams] = useState<API.ChartQueryRequest>({...initSearchParams});
  const [loading, setLoading] = useState<boolean>(false);
  const {initialState} = useModel('@@initialState');
  const {currentUser} = initialState ?? {};
  const [total, setTotal] = useState<number>(0);
  const [chartList, setChartList] = useState<API.Chart[]>();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listMyChartByPageUsingPost(searchParams);
      if (res.data) {
        setChartList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
        // 隐藏图表的title
        if (res.data.records) {
          res.data.records.forEach(data => {
            if (data.status === ChartStatusEnum.SUCCEED) {
              const chartOption = JSON.parse(data.genChart ?? '{}');
              chartOption.title = undefined;
              data.genChart = JSON.stringify(chartOption);
            }
          })
        }
      } else {
        message.error("获取图表失败");
      }
    } catch (e: any) {
      message.error("获取图表失败，" + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  return (
    <div className="my-chart-page">
      <div>
        <Search placeholder="请输入图表名称" enterButton loading={loading} onSearch={(value) => {
          // 设置搜索条件
          setSearchParams({
            ...initSearchParams,
            name: value,
          })
        }}/>
      </div>
      <Divider/> {/*分割线*/}

      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 1,
          lg: 2,
          xl: 2,
          xxl: 2,
        }}
        pagination={{
          onChange: (page, pageSize) => {
            setSearchParams({
              ...searchParams,
              current: page,
              pageSize,
            })
          },
          current: searchParams.current,
          pageSize: searchParams.pageSize,
          total: total,
        }}
        loading={loading}
        dataSource={chartList}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card style={{width: '100%'}}>
              <List.Item.Meta
                avatar={<Avatar src={currentUser && currentUser.userAvatar}/>}
                title={item.name}
                description={item.chartType ? '图表类型：' + item.chartType : undefined}
              />
              <>
                {
                  item.status === ChartStatusEnum.WAIT && <>
                    <Result
                      status="warning"
                      title="待生成"
                      subTitle={item.execMessage ?? '当前图表生成队列繁忙，请耐心等候'}
                    />
                  </>
                }
                {
                  item.status === ChartStatusEnum.RUNNING && <>
                    <Result
                      status="info"
                      title="图表生成中"
                      subTitle={item.execMessage}
                    />
                  </>
                }
                {
                  item.status === ChartStatusEnum.SUCCEED && <>
                    <div style={{marginBottom: 16}}/>
                    <p>{'分析目标：' + item.goal}</p>
                    <div style={{marginBottom: 16}}/>
                    <ReactECharts option={item.genChart && JSON.parse(item.genChart)}/>
                    <div style={{textIndent: '2em'}}>{item.genResult ?? ''}</div>
                    <div style={{textAlign: "right"}}>
                      {item && item.createTime ? format(new Date(item.createTime), 'yyyy-MM-dd HH:mm:ss') : ''}
                    </div>
                  </>
                }
                {
                  item.status === ChartStatusEnum.FAILED && <>
                    <Result
                      status="error"
                      title="图表生成失败"
                      subTitle={item.execMessage}
                    />
                  </>
                }
              </>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};
export default MyChart;
