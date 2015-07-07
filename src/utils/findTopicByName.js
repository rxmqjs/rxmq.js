/**
 * Find a specific subject by given name
 * @param  {Array}                  subjects    Array of subjects to search in
 * @param  {String}                 name        Name to search for
 * @return {(EndlessSubject|void)}              Found subject or void
 */
const findSubjectByName = (subjects, name) => {
    const res = subjects.filter(s => s.name === name);
    if (!res || res.length < 1) {
        return;
    }

    return res[0];
};

export {findSubjectByName};
