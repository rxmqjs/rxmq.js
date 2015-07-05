const topicToRegex = (topic) => '^' + topic.split('.').reduce((result, segment, index, arr) => {
    let res = '';
    if (arr[index - 1]) {
        res = arr[index - 1] !== '#' ? '\\.\\b' : '\\b';
    }
    if (segment === '#') {
        res += '[\\s\\S]*';
    } else if (segment === '*') {
        res += '[^.]+';
    } else {
        res += segment;
    }
    return result + res;
}, '');

const compareTopics = (topic, existingTopic) => {
    // if no # or * found, do plain string matching
    if (existingTopic.indexOf('#') === -1 && existingTopic.indexOf('*') === -1) {
        return topic === existingTopic;
    }
    // otherwise do regex matching
    const pattern = topicToRegex(existingTopic);
    const rgx = new RegExp(pattern);
    const result = rgx.test(topic);
    return result;
};

export {compareTopics};
