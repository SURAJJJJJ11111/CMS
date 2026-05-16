package com.example.cms.repository;

import com.example.cms.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
