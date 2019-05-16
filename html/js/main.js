// 时间处理帮助函数
const timHelper = {
  // 获取秒时间戳
  toMs: function (time) {
    return parseInt(new Date(time).getTime() / 1000)
  }
}

// 过滤时间段
const dayPeriod = {
  all: function () {
    return [0]
  },
  // 昨天
  prevDay: function () {
    let from = moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00')
    let to = moment().format('YYYY-MM-DD 00:00:00')
    return [timHelper.toMs(from), timHelper.toMs(to)]
  },

  // 本周
  thisWeek: function () {
    let today = (new Date()).getDay()
    let from = moment().add(1 - today, 'days').format('YYYY-MM-DD 00:00:00')
    return [timHelper.toMs(from)]
  },

  // 上周
  prevWeek: function () {
    let today = (new Date()).getDay()
    let from = moment().add(1 - 7 - today, 'days').format('YYYY-MM-DD 00:00:00')
    let to = moment().add(1 - today, 'days').format('YYYY-MM-DD 00:00:00')
    return [timHelper.toMs(from), timHelper.toMs(to)]
  },
  // 本月1号
  thisMonth: function () {
    let from = moment().format('YYYY-MM-01 00:00:00')
    return [timHelper.toMs(from)]
  },
  // 上月1号
  prevMonth: function () {
    let from = moment().add(-1, 'months').format('YYYY-MM-01 00:00:00')
    let to = moment().format('YYYY-MM-01 00:00:00')
    return [timHelper.toMs(from), timHelper.toMs(to)]
  }
}

// 折线图
const drawLine = function (xAxis, yAxis) {
  let myChart = echarts.init(document.getElementById('echart-codes'))
  let option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: yAxis,
      type: 'line',
      areaStyle: {}
    }]
  }
  myChart.setOption(option)
}

new Vue({
  el: '#app',
  data: {
    gitdata: window.JSONDATA,
    view: 'codes',
    views: [
      {
        key: 'author',
        name: '开发者'
      }, {
        key: 'codes',
        name: '代码量'
      }
    ],
    daylist: {
      prevDay: '昨天',
      thisWeek: '本周',
      prevWeek: '上周',
      thisMonth: '本月',
      prevMonth: '上月',
      all: '全部'
    },
    startday: 'all'// 从哪天开始（时间戳）

  },
  computed: {
    authors: function () {
      let _period = dayPeriod[this.startday]()
      let data = this.gitdata.filter(item => {
        return item.time >= _period[0] && (_period[1] ? item.time < _period[1] : true)
      }).reduce((result, item) => {
        result[item.author] = result[item.author] || {
          commits: 0,
          '+lines': 0,
          '-lines': 0
        }
        result[item.author].commits += 1
        result[item.author]['+lines'] += item['+lines']
        result[item.author]['-lines'] += item['-lines']
        return result
      }, {})
      let arr = []
      for (var key in data) {
        arr.push({
          name: key,
          commits: data[key].commits,
          '+lines': data[key]['+lines'],
          '-lines': data[key]['-lines']
        })
      }
      arr.sort((a, b) => {
        return b.commits - a.commits
      })
      return arr
    }
  },
  methods: {
    // 代码量折线图
    drawChartCodes: function () {
      let viewFormat = 'YYYY-MM'  // 视图类型
      let startDay = '2016-02-01' // 开始于哪一天

      let diffView = {
        'YYYY-MM-DD': 'days',
        'YYYY-MM': 'months',
        'YYYY': 'years'
      }

      let totalNum = 0
      let _gitdata = this.gitdata
      
      // 拿到所有数据
      let result = {}
      for (let i = _gitdata.length - 1; i >= 0; i--) {
        let item = _gitdata[i]
        let day = moment(item.time * 1000).format(viewFormat)
        totalNum += (item['+lines'] - item['-lines'])
        result[day] = totalNum
      }
      // 日视图 
      let datas = {}
      startDay = moment(startDay).format(viewFormat)
      let endDay = moment().format(viewFormat)
      let prevVal = 0 // 最开始时间所在的初始值
      while(startDay !== endDay) {
        datas[startDay] = result[startDay] || prevVal
        prevVal = datas[startDay]
        startDay = moment(startDay).add(1, diffView[viewFormat]).format(viewFormat)
      }
     
      drawLine(Object.keys(datas), Object.values(datas))
    }
  },
  mounted () {
    this.drawChartCodes()
  }
})
