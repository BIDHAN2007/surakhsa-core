/** Legacy module — persistence now uses store.js (JSON files in /data) */
const store = require('./store');

const db = {
  collection: (name) => ({
    where: (field, op, value) => ({
      get: async () => {
        const results = store.findGuardians({ [field]: op, [field]: value });
        return {
          empty: results.length === 0,
          docs: results.map((doc) => ({ id: doc.id, data: () => doc })),
        };
      },
    }),
    add: async (data) => store.addGuardian(data),
    doc: (id) => ({
      get: async () => {
        const doc = store.getGuardianById(id);
        return { exists: !!doc, id: doc?.id, data: () => doc };
      },
    }),
  }),
};

module.exports = { db, auth: {}, messaging: {} };
