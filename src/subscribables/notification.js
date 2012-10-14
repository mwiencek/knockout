ko.notification = (function () {
    var _transactions = 0, _callbackUid = 0,
        _notifications = [], _notificationsByCallback = {};

    function notifySubscribers () {
        var notification, subscription;

        while (notification = _notifications.shift()) {
            delete _notificationsByCallback[notification.key];
            subscription = notification.subscription;

            if (subscription.isDisposed !== true)
                subscription.callback(notification.valueToNotify);
        }
    }

    return {
        coalesce: function (callback) {
            ++_transactions;
            try {
                callback();
            } finally {
                if (_transactions == 1)
                    ko.dependencyDetection.ignore(notifySubscribers);
                --_transactions;
            }
        },

        send: function (subscription, valueToNotify, event) {
            if (_transactions == 0) {
                subscription.callback(valueToNotify);
                return;
            }
            var uid = subscription.callback.__ko_uid__, notification, key;
            if (!uid) subscription.callback.__ko_uid__ = uid = ++_callbackUid;
            key = uid + "." + event;

            if (notification = _notificationsByCallback[key]) {
                if (notification.valueToNotify !== valueToNotify)
                    notification.valueToNotify = valueToNotify;
            } else {
                _notifications.push(_notificationsByCallback[key] = {
                    subscription: subscription, valueToNotify: valueToNotify, key: key
                });
            }
        }
    };
}());

ko.exportSymbol('coalesceUpdates', ko.notification.coalesce);
