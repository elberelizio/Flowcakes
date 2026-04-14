package com.chefcontrol.dto;

public class UserFeedbackRequest {
    private int rating; // 1-5
    private String comment;

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
