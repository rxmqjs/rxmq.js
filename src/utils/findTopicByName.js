const findSubjectsByName = (subjects, name) => {
    const res = subjects.filter(s => s.name === name);
    if (!res || res.length < 1) {
        return;
    }

    return res[0];
};

export {findSubjectsByName};
