ko.notification = (function () {
    var transactions = 0,
        callbackUid = 0,
        allNotifications = [],
        notificationsByCallback = {},
        uidProp = "__ko_uid__";

    function notifySubscribers () {
        ko.utils.arrayForEach(allNotifications, function (notification) {
            delete notificationsByCallback[notification.key];
            var subscription = notification.subscription;

            if (subscription.isDisposed !== true)
                subscription.callback(notification.valueToNotify);
        });
        allNotifications = [];
    }

    return {
        coalesce: function (callback, target) {
            ++transactions;
            callback.call(target || null);

            if (--transactions === 0)
                ko.dependencyDetection.ignore(notifySubscribers);
        },

        send: function (subscription, valueToNotify, event) {
            if (transactions === 0) {
                subscription.callback(valueToNotify);
                return;
            }
            var uid = subscription.callback[uidProp];
            if (uid === undefined)
                subscription.callback[uidProp] = uid = ++callbackUid;

            var key = uid + "." + event,
                notification = notificationsByCallback[key];

            if (notification) {
                notification.valueToNotify = valueToNotify;
            } else {
                allNotifications.push(notificationsByCallback[key] = {
                    key: key,
                    subscription: subscription,
                    valueToNotify: valueToNotify
                });
            }
        }
    };
}());

ko.exportSymbol('coalesceUpdates', ko.notification.coalesce);
