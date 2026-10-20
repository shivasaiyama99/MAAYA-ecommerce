import bcrypt from 'bcryptjs';

// Ephemeral in-memory customer accounts for local development when MongoDB URI is pending
const devUsers = new Map();

export const devUserStore = {
  findUserByEmail: (email) => {
    if (!email) return null;
    return devUsers.get(email.toLowerCase().trim()) || null;
  },

  findUserById: (id) => {
    if (!id) return null;
    for (const user of devUsers.values()) {
      if (user._id === id || user._id?.toString() === id.toString()) {
        return user;
      }
    }
    return null;
  },

  createUser: async ({ name, email, password, phone, role = 'customer' }) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const normalizedEmail = email.toLowerCase().trim();
    const id = 'dev_usr_' + Math.random().toString(36).substring(2, 11);

    const user = {
      _id: id,
      name,
      email: normalizedEmail,
      phone: phone || '',
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
      },
      toJSON: function () {
        const copy = { ...this };
        delete copy.password;
        return copy;
      },
    };

    devUsers.set(normalizedEmail, user);
    return user;
  },

  clear: () => {
    devUsers.clear();
  },
};

export default devUserStore;
