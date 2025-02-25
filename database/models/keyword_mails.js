module.exports = (sequelize, DataTypes) => {
    const keyword_mails = sequelize.define(
        "keyword_mails",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                allowNull: true,
                primaryKey: true,
            },
            send_by: {
                type: DataTypes.INTEGER
            },
            received_by: {
                type: DataTypes.STRING("255"),
                allowNull: true,
            },
            is_group: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            keywords: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            message : {
                type: DataTypes.TEXT,
                allowNull: true
            },
            date_time : {
                type: DataTypes.DATE,
                allowNull: true
            },
            deleted_at: {
                type: DataTypes.INTEGER,
                allowNull: true,
            }
        },
        { timeStamps: true }
    )
    return keyword_mails
}