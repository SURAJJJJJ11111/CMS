package com.example.cms.repository;

import com.example.cms.entity.Complaint;
import com.example.cms.enums.ComplaintStatus;
import com.example.cms.enums.Department;
import com.example.cms.enums.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findByRaisedById(Long userId, Pageable pageable);

    Page<Complaint> findByAssignedToId(Long agentId, Pageable pageable);

    Page<Complaint> findByDepartment(Department department, Pageable pageable);

    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    long countByStatus(ComplaintStatus status);

    long countByDepartment(Department department);

    long countByEscalatedTrue();

    long countByPriority(Priority priority);

    @Query("SELECT c FROM Complaint c WHERE c.status IN :statuses AND c.escalated = false AND c.slaDeadline < :now")
    List<Complaint> findOverdueComplaints(
            @Param("statuses") List<ComplaintStatus> statuses,
            @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'RESOLVED' AND c.resolvedAt >= :since")
    long countResolvedSince(@Param("since") LocalDateTime since);

    @Query("SELECT c.createdAt, c.resolvedAt FROM Complaint c WHERE c.resolvedAt IS NOT NULL")
    List<Object[]> findResolvedComplaintsTimestamps();
}
