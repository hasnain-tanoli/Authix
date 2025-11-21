import { DataTypes } from "sequelize";

const createPostModel = (sequelize) => {
  const Post = sequelize.define("Post", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    featuredImageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Media",
        key: "id",
      },
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return Post;
};

export default createPostModel;
