import { DataTypes } from "sequelize";

const createPostHistoryModel = (sequelize) => {
  const PostHistory = sequelize.define("PostHistory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contentSnapshot: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    changedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
  return PostHistory;
};

export default createPostHistoryModel;
