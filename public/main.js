var FADE_TIME = 150 // ms
var TYPING_TIMER_LENGTH = 500 // ms
var PRINT_CHAT_TIME = 2 * 60 * 1000 //ms
var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
]

// var $window = $(window);
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.inputMessage'); // Input message input box

var $loginPage = $('.login.page'); // The login page
var $chatPage = $('.chat.page'); // The chatroom page
var $title = $('.title') //The login page tile

var socket
var isLogined = false
var latestChatTime = Date.now()
var isTyping = false
var latestTypingTime = Date.now()
console.log($('#app'))
new Vue({
    el: '#app',
    data: {
        messages: [],
        userName: '',
        userList: [],
        inputMessage: '',
        typingMsg: {}
    },
    methods: {
        initSocketIO: function() {
            var Vue = this

            socket = io.connect()
            socket.on('connect', function() {
                console.log('server connected.')
                socket.on('sync user list', function(userList) {
                    Vue.setUserList(userList)
                })
                socket.on('user name duplicate', function() {
                    $title.text('聊天室里有人与你重名la')
                })
                socket.on('chat', function(data) {
                    Vue.messages.push(data)
                    if (Date.now() - latestChatTime > PRINT_CHAT_TIME)
                        Vue.logMsg(Vue.ToCETime(Date.now()))
                    latestChatTime = Date.now()
                })
                socket.on('typing', function(data) {
                    Vue.addChatTyping(data)
                })
                socket.on('stop typing', function(data) {
                    Vue.removeChatTyping(data)

                })
                socket.on('user joined', function(data) {
                    Vue.logMsg(data.username + '加入聊天室')
                    Vue.logMsg('当前聊天室有' + data.numUsers + '人')
                })
                socket.on('user left', function(data) {
                    Vue.logMsg(data.username + '离开聊天室')
                    Vue.logMsg('当前聊天室有' + data.numUsers + '人')
                })
            })
        },
        setName: function() {
            this.initSocketIO()
            if (this.userName) {
                socket.emit('enter chat room', this.userName)
                this.logMsg('欢迎' + this.userName + '来到聊天室')
                $loginPage.fadeOut();
                $chatPage.show();
                $loginPage.off('click');
                $currentInput = $inputMessage.focus();
                isLogined = true
            }
        },
        pushMessage: function() {
            // isTyping
            socket.emit('stop typing', {})
            socket.emit('chat', { user: this.userName, msg: this.inputMessage })
            this.inputMessage = ''
        },
        setUserList: function(names) {
            this.userList = names
        },
        clearMessages: function() {
            this.messages = []
        },
        logMsg: function(msg) {
            this.messages.push({ log: msg })
        },
        getUserNameColor: function(username) {
            var hash = 0
            for (var i = 0; i < username.length; i++) {
                hash += username.charCodeAt(i)
            }
            return COLORS[hash % COLORS.length]
        },
        addChatTyping: function(data) {
            this.typingMsg = data
            var typingUsr = $messages.find('.username:last')
            typingUsr[0].style.display = 'show'
        },
        removeChatTyping: function(data) {
            this.typingMsg = data
            var typingUsr = $messages.find('.username:last')
            typingUsr[0].style.display = 'none'
        },
        ToCETime: function(timeStamp) {
            timeStamp /= 1000
            var seconds = timeStamp % 80
            timeStamp /= 80
            var hours = timeStamp % 80
            timeStamp /= 80
            var days = timeStamp % 58
            timeStamp /= 58
            var months = timeStamp % 22
            timeStamp /= 22
            var years = timeStamp % 9999
            return 'CE.' + years + '年' + months + '月' + days + '日' + hours + '时' + seconds + '分'
        },
        test: function() {}
    },
    watch: {
        'inputMessage': function(val, oldVal) {
            latestTypingTime = Date.now()

            if (isLogined && !isTyping && val != '') {
                socket.emit('typing', { user: this.userName, msg: '正在输入..' })
                isTyping = true
            }
            setTimeout(function() {
                var time = Date.now()
                if (time - latestTypingTime >= TYPING_TIMER_LENGTH - 5) {
                    socket.emit('stop typing', {})
                    isTyping = false
                }
            }, TYPING_TIMER_LENGTH)
        },
        'messages': function(val, oldVal) {
            var Vue = this
            $messages[0].scrollTop = $messages[0].scrollHeight
            $messages.find('.username').each(function() {
                this.style.color = Vue.getUserNameColor(this.innerHTML)
            })
        },
        'typingMsg': function() {
            var Vue = this
            var typingUsr = $messages.find('.username:last')
            typingUsr[0].style.display = 'true'
            typingUsr[0].style.color = Vue.getUserNameColor(typingUsr[0].innerHTML)
        }
    },
    transitions: {
        //     'fadeIN': {
        //         css: false,
        //         enter: function(el, done) {
        //             $(el)
        //                 .css('opacity', 0)
        //                 .animate({ opacity: 1 }, 10000, done)
        //         }
        // }
    }
})